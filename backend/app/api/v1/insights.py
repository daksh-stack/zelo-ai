from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.quiz import QuizAttempt, QuizKind
from app.schemas.phase3 import (
    MicroQuizOut, AnswerQuizRequest, AnswerQuizResponse,
    WeeklyReportOut, AdvancePhaseOut,
)
from app.services.quiz_service import make_micro_quiz
from app.services.progress_insights_service import weekly_report, advance_phase
from app.services.gamification_service import process_task_completion

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.post("/tasks/{task_id}/quiz", response_model=MicroQuizOut)
async def create_task_quiz(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")

    payload = make_micro_quiz(task)
    quiz = QuizAttempt(
        user_id=current_user.id,
        task_id=task.id,
        kind=QuizKind.task_micro,
        question=payload["question"],
        options=payload["options"],
        correct_index=payload["correct_index"],
        topic=payload["topic"],
    )
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return MicroQuizOut(
        id=quiz.id,
        task_id=quiz.task_id,
        question=quiz.question,
        options=quiz.options or [],
        topic=quiz.topic,
    )


@router.post("/quiz/{quiz_id}/answer", response_model=AnswerQuizResponse)
async def answer_quiz(
    quiz_id: str,
    body: AnswerQuizRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(QuizAttempt).where(QuizAttempt.id == quiz_id, QuizAttempt.user_id == current_user.id)
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    if quiz.answered_at:
        raise HTTPException(400, "Already answered")

    quiz.user_index = body.selected_index
    quiz.is_correct = body.selected_index == quiz.correct_index
    quiz.score = 1.0 if quiz.is_correct else 0.0
    quiz.answered_at = datetime.now(timezone.utc)

    if quiz.is_correct:
        await process_task_completion(db, current_user.id, xp_earned=5)

    await db.commit()
    await db.refresh(quiz)
    return AnswerQuizResponse(
        id=quiz.id,
        is_correct=quiz.is_correct,
        score=quiz.score,
        correct_index=quiz.correct_index,
    )


@router.get("/weekly", response_model=WeeklyReportOut)
async def get_weekly(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await weekly_report(db, current_user.id)


@router.post("/roadmaps/advance-phase", response_model=AdvancePhaseOut)
async def post_advance_phase(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        data = await advance_phase(db, current_user.id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return data