from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.skill_path import (
    InterviewSession, InterviewAnswer,
    InterviewSessionStatus,
)
from app.schemas.skill_path import (
    QuickRevisionResponse, RevisionCardOut,
    StartInterviewRequest, InterviewSessionOut, InterviewQuestionOut,
    SubmitAnswerRequest, SubmitAnswerResponse,
    SocraticProbeRequest, SocraticProbeResponse,
    SocraticEvaluateRequest, SocraticEvaluateResponse,
)
from app.services.quick_revision_service import build_revision_deck
from app.services.interview_service import get_questions, score_answer
from app.services.socratic_service import generate_recall_probe, evaluate_probe_answer
from app.services.gamification_service import process_task_completion

router = APIRouter(prefix="/skill-path", tags=["Skill Path"])


@router.get("/quick-revision", response_model=QuickRevisionResponse)
async def quick_revision(
    topics: str | None = Query(None, description="Comma-separated: dsa,os,dbms,system_design"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    weak = (profile.weak_areas if profile else None) or []
    topic_list = [t.strip() for t in topics.split(",")] if topics else None

    cards = build_revision_deck(topic_list, weak, limit=12)
    return {
        "cards": [RevisionCardOut(**c) for c in cards],
        "count": len(cards),
    }


@router.post("/interview-practice/sessions", response_model=InterviewSessionOut, status_code=201)
async def start_interview(
    body: StartInterviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    qs = get_questions(body.domain.value, body.total_questions)
    session = InterviewSession(
        user_id=current_user.id,
        domain=body.domain,
        total_questions=len(qs),
        status=InterviewSessionStatus.active,
    )
    db.add(session)
    await db.flush()

    question_out = []
    for i, item in enumerate(qs, start=1):
        ans = InterviewAnswer(
            session_id=session.id,
            user_id=current_user.id,
            question=item["q"],
            model_answer=item["a"],
            order=i,
        )
        db.add(ans)
        await db.flush()
        question_out.append(InterviewQuestionOut(id=ans.id, order=i, question=item["q"]))

    await db.commit()
    await db.refresh(session)
    return InterviewSessionOut(
        id=session.id,
        domain=session.domain,
        status=session.status,
        total_questions=session.total_questions,
        answered_count=session.answered_count,
        score_total=session.score_total,
        questions=question_out,
        created_at=session.created_at,
    )


@router.post("/interview-practice/answer", response_model=SubmitAnswerResponse)
async def submit_interview_answer(
    body: SubmitAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewAnswer).where(
            InterviewAnswer.id == body.answer_id,
            InterviewAnswer.user_id == current_user.id,
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(404, "Question not found")
    if row.user_answer is not None:
        raise HTTPException(400, "Already answered")

    score, feedback = score_answer(row.model_answer, body.user_answer)
    row.user_answer = body.user_answer
    row.score = score
    row.feedback = feedback

    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == row.session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one()
    session.answered_count += 1
    session.score_total += score

    if session.answered_count >= session.total_questions:
        session.status = InterviewSessionStatus.completed
        session.completed_at = datetime.now(timezone.utc)
        await process_task_completion(db, current_user.id, xp_earned=25)
    else:
        await process_task_completion(db, current_user.id, xp_earned=8)

    await db.commit()
    avg = session.score_total / max(session.answered_count, 1)
    return SubmitAnswerResponse(
        answer_id=row.id,
        score=score,
        feedback=feedback,
        model_answer=row.model_answer,
        session_score_avg=round(avg, 2),
        answered_count=session.answered_count,
        status=session.status,
    )


@router.get("/interview-practice/sessions/{session_id}", response_model=InterviewSessionOut)
async def get_interview_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    result = await db.execute(
        select(InterviewAnswer)
        .where(InterviewAnswer.session_id == session_id)
        .order_by(InterviewAnswer.order)
    )
    answers = result.scalars().all()
    # Hide model answers until answered — only return question text
    questions = [
        InterviewQuestionOut(id=a.id, order=a.order, question=a.question)
        for a in answers
    ]
    return InterviewSessionOut(
        id=session.id,
        domain=session.domain,
        status=session.status,
        total_questions=session.total_questions,
        answered_count=session.answered_count,
        score_total=session.score_total,
        questions=questions,
        created_at=session.created_at,
    )


@router.post("/test-understanding", response_model=SocraticProbeResponse)
async def test_understanding(
    body: SocraticProbeRequest,
    current_user: User = Depends(get_current_user),
):
    probes = generate_recall_probe(body.topic_title, body.notes_summary)
    return {"probes": probes}


@router.post("/test-understanding/evaluate", response_model=SocraticEvaluateResponse)
async def evaluate_understanding(
    body: SocraticEvaluateRequest,
    current_user: User = Depends(get_current_user),
):
    return evaluate_probe_answer(body.question, body.user_answer)