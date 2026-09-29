from datetime import date, timedelta, datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.task import Task, TaskStatus, DailyPlan
from app.models.quiz import QuizAttempt
from app.models.roadmap import Roadmap
from app.models.gamification import Streak, UserXP
from app.services.adaptation_service import recent_task_stats


async def weekly_report(db: AsyncSession, user_id: str) -> dict:
    stats = await recent_task_stats(db, user_id, days=7)
    start = (date.today() - timedelta(days=6)).isoformat()

    result = await db.execute(
        select(DailyPlan).where(DailyPlan.user_id == user_id, DailyPlan.date >= start)
    )
    days_with_plan = len(result.scalars().all())

    result = await db.execute(
        select(Roadmap).where(Roadmap.user_id == user_id, Roadmap.is_active == True)
    )
    roadmap = result.scalar_one_or_none()

    quiz = await db.execute(select(QuizAttempt).where(QuizAttempt.user_id == user_id))
    quizzes = [q for q in quiz.scalars().all() if q.answered_at]
    quiz_acc = (
        round(sum(1 for q in quizzes if q.is_correct) / len(quizzes), 2) if quizzes else None
    )

    recs = []
    if stats["skip_rate"] > 0.3:
        recs.append("You skipped a lot. Tomorrow’s plan is shorter — finish first, then stretch.")
    if stats["completion_rate"] >= 0.8:
        recs.append("High consistency. Ready for a medium-problem push.")
    if quiz_acc is not None and quiz_acc < 0.5:
        recs.append("Quiz accuracy is low. Use Quick Revision on weak topics.")
    if not recs:
        recs.append("Stay on the current phase. Protect the streak.")

    return {
        "window_days": 7,
        "days_planned": days_with_plan,
        "completion_rate": stats["completion_rate"],
        "skip_rate": stats["skip_rate"],
        "quiz_accuracy": quiz_acc,
        "current_phase": roadmap.current_phase if roadmap else None,
        "roadmap_title": roadmap.title if roadmap else None,
        "recommendations": recs,
        "can_advance_phase": stats["completion_rate"] >= 0.75 and days_with_plan >= 5,
    }


async def advance_phase(db: AsyncSession, user_id: str) -> dict:
    result = await db.execute(
        select(Roadmap).where(Roadmap.user_id == user_id, Roadmap.is_active == True)
    )
    roadmap = result.scalar_one_or_none()
    if not roadmap:
        raise ValueError("No active roadmap")

    report = await weekly_report(db, user_id)
    if not report["can_advance_phase"]:
        raise ValueError("Not enough consistent completion to advance yet")

    phases = roadmap.phases or []
    if roadmap.current_phase >= len(phases) - 1:
        return {"advanced": False, "message": "Already on final phase", "current_phase": roadmap.current_phase}

    roadmap.current_phase += 1
    await db.commit()
    await db.refresh(roadmap)
    return {
        "advanced": True,
        "current_phase": roadmap.current_phase,
        "phase_title": phases[roadmap.current_phase].get("title"),
    }