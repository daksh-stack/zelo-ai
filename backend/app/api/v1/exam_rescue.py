from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.exam_rescue import (
    ExamSession, ExamTopicPlan, ExamSessionStatus, TopicStatus, TopicImportance
)
from app.schemas.exam_rescue import (
    CreateExamSessionRequest, ExamSessionResponse,
    UpdateTopicStatusRequest, ExamTopicResponse, RevisionSheetResponse
)
from app.services.exam_rescue_service import generate_plan, compile_revision_sheet
from app.services.gamification_service import process_task_completion

router = APIRouter(prefix="/exam-rescue", tags=["Exam Rescue"])


@router.post("/sessions", response_model=ExamSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: CreateExamSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plan = generate_plan(body.subject, body.hours_available, body.strategy.value)

    session = ExamSession(
        user_id=current_user.id,
        subject=body.subject,
        exam_time=body.exam_time,
        hours_available=body.hours_available,
        strategy=body.strategy,
        status=ExamSessionStatus.active,
    )
    db.add(session)
    await db.flush()

    for i, t in enumerate(plan, start=1):
        db.add(ExamTopicPlan(
            session_id=session.id,
            title=t["title"],
            unit_name=t["unit_name"],
            importance=TopicImportance(t["importance"]),
            allocated_minutes=t.get("allocated_minutes", 30),
            order=i,
            notes_summary=t.get("notes_summary"),
            key_formulas=t.get("key_formulas") or [],
            likely_questions=t.get("likely_questions") or [],
        ))

    await db.commit()

    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.topics))
        .where(ExamSession.id == session.id)
    )
    return result.scalar_one()


@router.get("/sessions/{session_id}", response_model=ExamSessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.topics))
        .where(ExamSession.id == session_id, ExamSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@router.get("/sessions", response_model=list[ExamSessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.topics))
        .where(ExamSession.user_id == current_user.id)
        .order_by(ExamSession.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/topics/{topic_id}/status", response_model=ExamTopicResponse)
async def update_topic_status(
    topic_id: str,
    body: UpdateTopicStatusRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExamTopicPlan)
        .join(ExamSession, ExamTopicPlan.session_id == ExamSession.id)
        .where(ExamTopicPlan.id == topic_id, ExamSession.user_id == current_user.id)
    )
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(404, "Topic not found")

    topic.status = body.status
    if body.status == TopicStatus.covered:
        topic.covered_at = datetime.now(timezone.utc)
        await process_task_completion(db, current_user.id, xp_earned=15)
    elif body.status == TopicStatus.skipped:
        topic.covered_at = None

    await db.commit()
    await db.refresh(topic)
    return topic


@router.get("/sessions/{session_id}/revision-sheet", response_model=RevisionSheetResponse)
async def get_revision_sheet(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.topics))
        .where(ExamSession.id == session_id, ExamSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    return compile_revision_sheet(session, session.topics)


@router.post("/sessions/{session_id}/complete", response_model=ExamSessionResponse)
async def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExamSession)
        .options(selectinload(ExamSession.topics))
        .where(ExamSession.id == session_id, ExamSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    session.status = ExamSessionStatus.completed
    await db.commit()
    await db.refresh(session)
    return session