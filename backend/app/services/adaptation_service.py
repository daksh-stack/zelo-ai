from datetime import date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.task import Task, TaskStatus, DailyPlan
from app.models.quiz import QuizAttempt


async def recent_task_stats(db: AsyncSession, user_id: str, days: int = 14) -> dict:
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    result = await db.execute(
        select(Task)
        .join(DailyPlan, Task.daily_plan_id == DailyPlan.id)
        .where(Task.user_id == user_id, DailyPlan.date >= cutoff)
    )
    tasks = result.scalars().all()
    total = len(tasks) or 1
    skipped = [t for t in tasks if t.status == TaskStatus.skipped]
    done = [t for t in tasks if t.status == TaskStatus.done]
    partial = [t for t in tasks if t.status == TaskStatus.partial]

    skip_topics = []
    for t in skipped:
        skip_topics.append((t.title or "").lower())

    quiz = await db.execute(
        select(QuizAttempt).where(QuizAttempt.user_id == user_id, QuizAttempt.is_correct == False)
    )
    wrong = [q.topic for q in quiz.scalars().all() if q.topic]

    return {
        "completion_rate": round(len(done) / total, 2),
        "skip_rate": round(len(skipped) / total, 2),
        "partial_rate": round(len(partial) / total, 2),
        "skip_titles": skip_topics[-20:],
        "weak_quiz_topics": wrong[-10:],
        "total_recent": len(tasks),
    }