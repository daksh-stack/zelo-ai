from datetime import date, datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.habits import (
    StreakFreezeLog, Challenge, UserBadge, FocusSession,
    ChallengePeriod, ChallengeStatus, FocusSessionStatus,
)
from app.models.gamification import Streak, UserXP
from app.models.task import Task, TaskStatus, DailyPlan
from app.content.habit_banks import (
    DAILY_CHALLENGES, WEEKLY_CHALLENGES, BADGE_DEFS, week_key,
)
from app.services.gamification_service import process_task_completion


async def _streak(db: AsyncSession, user_id: str) -> Streak:
    result = await db.execute(select(Streak).where(Streak.user_id == user_id))
    s = result.scalar_one_or_none()
    if not s:
        s = Streak(user_id=user_id, current_streak=0, longest_streak=0, freezes_remaining=1)
        db.add(s)
        await db.flush()
    return s


async def use_streak_freeze(db: AsyncSession, user_id: str) -> dict:
    """
    If the user missed yesterday, consume 1 freeze and keep current_streak.
    """
    streak = await _streak(db, user_id)
    today = date.today()
    yesterday = today - timedelta(days=1)

    if streak.freezes_remaining <= 0:
        raise HTTPException(400, "No streak freezes remaining")

    last = streak.last_active_date
    if last == today or last == yesterday:
        raise HTTPException(400, "Streak is already intact — freeze not needed")

    # already froze this missed day?
    result = await db.execute(
        select(StreakFreezeLog).where(
            StreakFreezeLog.user_id == user_id,
            StreakFreezeLog.used_on == yesterday,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "Freeze already used for yesterday")

    streak.freezes_remaining -= 1
    streak.last_active_date = yesterday
    db.add(StreakFreezeLog(user_id=user_id, used_on=yesterday))
    await db.commit()
    await db.refresh(streak)
    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_active_date": str(streak.last_active_date),
        "freezes_remaining": streak.freezes_remaining,
        "saved_day": str(yesterday),
    }


async def ensure_challenges(db: AsyncSession, user_id: str) -> list[Challenge]:
    today = date.today().isoformat()
    wk = week_key()

    result = await db.execute(
        select(Challenge).where(
            Challenge.user_id == user_id,
            Challenge.period_key.in_([today, wk]),
        )
    )
    existing = result.scalars().all()
    have = {(c.code, c.period_key) for c in existing}

    created = []
    for spec in DAILY_CHALLENGES:
        key = (spec["code"], today)
        if key not in have:
            c = Challenge(
                user_id=user_id,
                period=ChallengePeriod.daily,
                period_key=today,
                status=ChallengeStatus.active,
                **{k: spec[k] for k in ("code", "title", "description", "target", "xp_reward")},
            )
            db.add(c)
            created.append(c)
    for spec in WEEKLY_CHALLENGES:
        key = (spec["code"], wk)
        if key not in have:
            c = Challenge(
                user_id=user_id,
                period=ChallengePeriod.weekly,
                period_key=wk,
                status=ChallengeStatus.active,
                **{k: spec[k] for k in ("code", "title", "description", "target", "xp_reward")},
            )
            db.add(c)
            created.append(c)

    if created:
        await db.commit()
        result = await db.execute(
            select(Challenge).where(
                Challenge.user_id == user_id,
                Challenge.period_key.in_([today, wk]),
            )
        )
        existing = result.scalars().all()
    return existing


async def sync_challenge_progress(db: AsyncSession, user_id: str) -> list[Challenge]:
    challenges = await ensure_challenges(db, user_id)
    today = date.today().isoformat()
    week_start = date.today() - timedelta(days=date.today().weekday())

    result = await db.execute(
        select(Task).join(DailyPlan, Task.daily_plan_id == DailyPlan.id).where(
            Task.user_id == user_id, DailyPlan.date == today
        )
    )
    today_tasks = result.scalars().all()

    result = await db.execute(
        select(func.count(func.distinct(DailyPlan.date))).where(
            DailyPlan.user_id == user_id,
            DailyPlan.date >= week_start.isoformat(),
        )
    )
    days_this_week = result.scalar() or 0

    result = await db.execute(
        select(func.count()).select_from(FocusSession).where(
            FocusSession.user_id == user_id,
            FocusSession.status == FocusSessionStatus.completed,
            FocusSession.ended_at >= datetime.combine(week_start, datetime.min.time()).replace(tzinfo=timezone.utc),
        )
    )
    focus_week = result.scalar() or 0

    for c in challenges:
        if c.status != ChallengeStatus.active:
            continue
        if c.code == "daily_finish_all":
            c.progress = 1 if today_tasks and all(t.status == TaskStatus.done for t in today_tasks) else 0
        elif c.code == "daily_no_skip":
            skipped = any(t.status == TaskStatus.skipped for t in today_tasks)
            progressed = any(t.status in (TaskStatus.done, TaskStatus.partial) for t in today_tasks)
            c.progress = 1 if progressed and not skipped else 0
        elif c.code == "weekly_5_days":
            c.progress = min(days_this_week, c.target)
        elif c.code == "weekly_focus_3":
            c.progress = min(focus_week, c.target)

        if c.progress >= c.target and c.status == ChallengeStatus.active:
            c.status = ChallengeStatus.completed
            c.completed_at = datetime.now(timezone.utc)
            await process_task_completion(db, user_id, xp_earned=c.xp_reward)

    await db.commit()
    for c in challenges:
        await db.refresh(c)
    return challenges


async def grant_badges(db: AsyncSession, user_id: str) -> list[UserBadge]:
    result = await db.execute(select(UserBadge).where(UserBadge.user_id == user_id))
    owned = {b.code for b in result.scalars().all()}

    streak = await _streak(db, user_id)
    result = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    xp = result.scalar_one_or_none()
    total_xp = xp.total_xp if xp else 0

    result = await db.execute(
        select(func.count()).select_from(Task).where(
            Task.user_id == user_id, Task.status == TaskStatus.done
        )
    )
    done_count = result.scalar() or 0

    result = await db.execute(
        select(func.count()).select_from(FocusSession).where(
            FocusSession.user_id == user_id,
            FocusSession.status == FocusSessionStatus.completed,
        )
    )
    focus_count = result.scalar() or 0

    new = []
    for spec in BADGE_DEFS:
        if spec["code"] in owned:
            continue
        ok = False
        if spec.get("min_tasks") and done_count >= spec["min_tasks"]:
            ok = True
        if spec.get("min_streak") and streak.current_streak >= spec["min_streak"]:
            ok = True
        if spec.get("min_xp") and total_xp >= spec["min_xp"]:
            ok = True
        if spec.get("min_focus") and focus_count >= spec["min_focus"]:
            ok = True
        if ok:
            b = UserBadge(
                user_id=user_id,
                code=spec["code"],
                title=spec["title"],
                description=spec["description"],
            )
            db.add(b)
            new.append(b)
    if new:
        await db.commit()
        for b in new:
            await db.refresh(b)
    return new


async def start_focus(db: AsyncSession, user_id: str, planned_minutes: int) -> FocusSession:
    result = await db.execute(
        select(FocusSession).where(
            FocusSession.user_id == user_id,
            FocusSession.status == FocusSessionStatus.running,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "A focus session is already running")

    minutes = max(15, min(90, planned_minutes))
    mult = 1.5 if minutes >= 45 else 1.25
    session = FocusSession(
        user_id=user_id,
        planned_minutes=minutes,
        xp_multiplier=mult,
        status=FocusSessionStatus.running,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def finish_focus(db: AsyncSession, user_id: str, session_id: str, aborted: bool) -> FocusSession:
    result = await db.execute(
        select(FocusSession).where(
            FocusSession.id == session_id,
            FocusSession.user_id == user_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Focus session not found")
    if session.status != FocusSessionStatus.running:
        raise HTTPException(400, "Session already closed")

    session.ended_at = datetime.now(timezone.utc)
    if aborted:
        session.status = FocusSessionStatus.aborted
        session.xp_awarded = 0
    else:
        session.status = FocusSessionStatus.completed
        base = 10
        session.xp_awarded = int(base * session.xp_multiplier)
        await process_task_completion(db, user_id, xp_earned=session.xp_awarded)

    await db.commit()
    await db.refresh(session)
    await grant_badges(db, user_id)
    await sync_challenge_progress(db, user_id)
    return session