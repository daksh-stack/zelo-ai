import json
from datetime import datetime, timezone, date
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.growth import (
    NotificationPreference,
    InAppNotification,
    NotificationKind,
    FeedbackTicket,
    AnalyticsEvent,
)
from app.models.task import DailyPlan, Task, TaskStatus
from app.models.gamification import Streak  # adjust import path if your Streak model lives elsewhere


async def get_or_create_prefs(db: AsyncSession, user_id: str) -> NotificationPreference:
    r = await db.execute(select(NotificationPreference).where(NotificationPreference.user_id == user_id))
    prefs = r.scalar_one_or_none()
    if prefs:
        return prefs
    prefs = NotificationPreference(user_id=user_id)
    db.add(prefs)
    await db.commit()
    await db.refresh(prefs)
    return prefs


async def update_prefs(db: AsyncSession, user_id: str, data: dict) -> NotificationPreference:
    prefs = await get_or_create_prefs(db, user_id)
    if "daily_reminder" in data and data["daily_reminder"] is not None:
        prefs.daily_reminder = bool(data["daily_reminder"])
    if "streak_risk" in data and data["streak_risk"] is not None:
        prefs.streak_risk = bool(data["streak_risk"])
    if "challenge_updates" in data and data["challenge_updates"] is not None:
        prefs.challenge_updates = bool(data["challenge_updates"])
    if "reminder_hour" in data and data["reminder_hour"] is not None:
        h = int(data["reminder_hour"])
        if h < 0 or h > 23:
            raise HTTPException(400, "reminder_hour must be 0-23")
        prefs.reminder_hour = h
    if "timezone" in data and data["timezone"]:
        prefs.timezone = str(data["timezone"])[:64]
    await db.commit()
    await db.refresh(prefs)
    return prefs


async def list_notifications(
    db: AsyncSession, user_id: str, unread_only: bool = False, limit: int = 30
) -> list[InAppNotification]:
    q = select(InAppNotification).where(InAppNotification.user_id == user_id)
    if unread_only:
        q = q.where(InAppNotification.is_read == False)
    q = q.order_by(InAppNotification.created_at.desc()).limit(min(limit, 50))
    r = await db.execute(q)
    return list(r.scalars().all())


async def mark_read(db: AsyncSession, user_id: str, notification_id: str | None = None) -> int:
    """Mark one or all as read. Returns rows updated."""
    if notification_id:
        r = await db.execute(
            select(InAppNotification).where(
                InAppNotification.id == notification_id,
                InAppNotification.user_id == user_id,
            )
        )
        n = r.scalar_one_or_none()
        if not n:
            raise HTTPException(404, "Notification not found")
        n.is_read = True
        await db.commit()
        return 1
    result = await db.execute(
        update(InAppNotification)
        .where(InAppNotification.user_id == user_id, InAppNotification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return result.rowcount or 0


async def push_in_app(
    db: AsyncSession,
    user_id: str,
    title: str,
    body: str,
    kind: NotificationKind = NotificationKind.system,
    href: str | None = None,
) -> InAppNotification:
    n = InAppNotification(
        user_id=user_id,
        title=title[:120],
        body=body,
        kind=kind,
        href=href,
    )
    db.add(n)
    await db.commit()
    await db.refresh(n)
    return n


async def create_feedback(
    db: AsyncSession, user_id: str, category: str, message: str, page: str | None
) -> FeedbackTicket:
    msg = (message or "").strip()
    if len(msg) < 5:
        raise HTTPException(400, "Message too short")
    if len(msg) > 2000:
        raise HTTPException(400, "Message too long")
    cat = (category or "general").strip()[:40]
    ticket = FeedbackTicket(
        user_id=user_id,
        category=cat,
        message=msg,
        page=(page or None) and page[:120],
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


async def track_event(
    db: AsyncSession, user_id: str | None, name: str, props: dict | None = None
) -> None:
    name = (name or "").strip()[:80]
    if not name:
        return
    row = AnalyticsEvent(
        user_id=user_id,
        name=name,
        props=json.dumps(props) if props else None,
    )
    db.add(row)
    await db.commit()


async def run_daily_reminder_pass(db: AsyncSession, target_hour: int | None = None) -> dict:
    """
    Idempotent-ish daily pass.
    Call from Render cron: POST /api/v1/growth/internal/run-reminders
    Logic: users with daily_reminder=True who have NO done tasks today → in-app nudge.
    """
    today = date.today().isoformat()
    r = await db.execute(select(NotificationPreference).where(NotificationPreference.daily_reminder == True))
    prefs_list = list(r.scalars().all())
    created = 0
    skipped = 0

    for prefs in prefs_list:
        if target_hour is not None and prefs.reminder_hour != target_hour:
            skipped += 1
            continue

        # already has a daily_reminder today?
        start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        r = await db.execute(
            select(InAppNotification).where(
                InAppNotification.user_id == prefs.user_id,
                InAppNotification.kind == NotificationKind.daily_reminder,
                InAppNotification.created_at >= start,
            )
        )
        if r.scalar_one_or_none():
            skipped += 1
            continue

        # any completed task today?
        r = await db.execute(
            select(DailyPlan).where(DailyPlan.user_id == prefs.user_id, DailyPlan.date == today)
        )
        plan = r.scalar_one_or_none()
        has_done = False
        if plan:
            r = await db.execute(
                select(Task).where(
                    Task.daily_plan_id == plan.id,
                    Task.status == TaskStatus.done,
                )
            )
            has_done = r.scalars().first() is not None

        if has_done:
            skipped += 1
            continue

        await push_in_app(
            db,
            prefs.user_id,
            title="Today's mission is waiting",
            body="Open Zelo and clear at least one task to keep your streak alive.",
            kind=NotificationKind.daily_reminder,
            href="/dashboard",
        )
        created += 1

    return {"created": created, "skipped": skipped}


async def run_streak_risk_pass(db: AsyncSession) -> dict:
    """Users with current_streak > 0 and no activity today → streak risk notice."""
    today = date.today().isoformat()
    r = await db.execute(select(NotificationPreference).where(NotificationPreference.streak_risk == True))
    prefs_list = list(r.scalars().all())
    created = 0
    skipped = 0
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    for prefs in prefs_list:
        r = await db.execute(select(Streak).where(Streak.user_id == prefs.user_id))
        streak = r.scalar_one_or_none()
        if not streak or (streak.current_streak or 0) < 1:
            skipped += 1
            continue

        r = await db.execute(
            select(InAppNotification).where(
                InAppNotification.user_id == prefs.user_id,
                InAppNotification.kind == NotificationKind.streak_risk,
                InAppNotification.created_at >= start,
            )
        )
        if r.scalar_one_or_none():
            skipped += 1
            continue

        r = await db.execute(
            select(DailyPlan).where(DailyPlan.user_id == prefs.user_id, DailyPlan.date == today)
        )
        plan = r.scalar_one_or_none()
        active_today = False
        if plan:
            r = await db.execute(
                select(Task).where(
                    Task.daily_plan_id == plan.id,
                    Task.status.in_([TaskStatus.done, TaskStatus.partial]),
                )
            )
            active_today = r.scalars().first() is not None

        if active_today:
            skipped += 1
            continue

        await push_in_app(
            db,
            prefs.user_id,
            title=f"Streak at risk · {streak.current_streak} days",
            body="One task today keeps the flame. Open your daily plan.",
            kind=NotificationKind.streak_risk,
            href="/dashboard",
        )
        created += 1

    return {"created": created, "skipped": skipped}