from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.schemas.growth import (
    PrefsUpdate, PrefsOut, NotificationOut, FeedbackIn, FeedbackOut, TrackEventIn, AppConfigOut,
)
from app.services.growth_service import (
    get_or_create_prefs, update_prefs, list_notifications, mark_read,
    create_feedback, track_event, run_daily_reminder_pass, run_streak_risk_pass,
)

router = APIRouter(prefix="/growth", tags=["Growth"])


@router.get("/config", response_model=AppConfigOut)
async def app_config():
    """Public-ish config for the frontend (no secrets)."""
    return {
        "environment": settings.ENVIRONMENT,
        "reminder_enabled": settings.REMINDER_ENABLED,
        "app_public_url": settings.APP_PUBLIC_URL,
        "features": {
            "exam_rescue": True,
            "skill_path": True,
            "squad": True,
            "habits": True,
            "reminders": settings.REMINDER_ENABLED,
            "feedback": True,
        },
    }


@router.get("/prefs", response_model=PrefsOut)
async def get_prefs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_or_create_prefs(db, current_user.id)


@router.patch("/prefs", response_model=PrefsOut)
async def patch_prefs(
    body: PrefsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await update_prefs(db, current_user.id, body.model_dump(exclude_unset=True))


@router.get("/notifications", response_model=list[NotificationOut])
async def get_notifications(
    unread_only: bool = False,
    limit: int = Query(30, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await list_notifications(db, current_user.id, unread_only=unread_only, limit=limit)
    return [
        {
            "id": n.id,
            "kind": n.kind.value if hasattr(n.kind, "value") else n.kind,
            "title": n.title,
            "body": n.body,
            "href": n.href,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in rows
    ]


@router.post("/notifications/read")
async def read_notifications(
    notification_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await mark_read(db, current_user.id, notification_id)
    return {"updated": count}


@router.post("/feedback", response_model=FeedbackOut, status_code=201)
async def post_feedback(
    body: FeedbackIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    t = await create_feedback(db, current_user.id, body.category, body.message, body.page)
    return t


@router.post("/events", status_code=204)
async def post_event(
    body: TrackEventIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await track_event(db, current_user.id, body.name, body.props)
    return None


def _assert_cron(x_cron_secret: str | None):
    secret = getattr(settings, "CRON_SECRET", None) or getattr(settings, "SECRET_KEY", None)
    if not x_cron_secret or x_cron_secret != secret:
        raise HTTPException(401, "Invalid cron secret")


@router.post("/internal/run-reminders")
async def internal_run_reminders(
    hour: int | None = Query(None, ge=0, le=23),
    x_cron_secret: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Protect with header: X-Cron-Secret: <SECRET_KEY or CRON_SECRET>
    Schedule on Render Cron Jobs once per hour.
    """
    _assert_cron(x_cron_secret)
    if not settings.REMINDER_ENABLED:
        return {"ok": True, "disabled": True}
    daily = await run_daily_reminder_pass(db, target_hour=hour)
    risk = await run_streak_risk_pass(db)
    return {"ok": True, "daily": daily, "streak_risk": risk}