from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.habits import UserBadge, FocusSession, FocusSessionStatus
from app.schemas.habits import (
    FreezeResponse, ChallengeOut, BadgeCatalogOut, BadgeOut,
    StartFocusRequest, FocusSessionOut, FinishFocusRequest,
)
from app.content.habit_banks import BADGE_DEFS
from app.services.habit_service import (
    use_streak_freeze, sync_challenge_progress, grant_badges,
    start_focus, finish_focus,
)

router = APIRouter(prefix="/habits", tags=["Habits"])


@router.post("/streak/freeze", response_model=FreezeResponse)
async def freeze_streak(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await use_streak_freeze(db, current_user.id)


@router.get("/challenges", response_model=list[ChallengeOut])
async def list_challenges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await sync_challenge_progress(db, current_user.id)


@router.get("/badges", response_model=BadgeCatalogOut)
async def list_badges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await grant_badges(db, current_user.id)
    result = await db.execute(select(UserBadge).where(UserBadge.user_id == current_user.id))
    earned_rows = result.scalars().all()
    earned_codes = {b.code for b in earned_rows}
    earned = [
        BadgeOut(code=b.code, title=b.title, description=b.description, earned_at=b.earned_at, earned=True)
        for b in earned_rows
    ]
    locked = [
        BadgeOut(code=d["code"], title=d["title"], description=d["description"], earned=False)
        for d in BADGE_DEFS if d["code"] not in earned_codes
    ]
    return {"earned": earned, "locked": locked}


@router.post("/focus/start", response_model=FocusSessionOut, status_code=201)
async def focus_start(
    body: StartFocusRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await start_focus(db, current_user.id, body.planned_minutes)


@router.post("/focus/{session_id}/finish", response_model=FocusSessionOut)
async def focus_finish(
    session_id: str,
    body: FinishFocusRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await finish_focus(db, current_user.id, session_id, body.aborted)


@router.get("/focus/active", response_model=FocusSessionOut | None)
async def focus_active(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FocusSession).where(
            FocusSession.user_id == current_user.id,
            FocusSession.status == FocusSessionStatus.running,
        )
    )
    return result.scalar_one_or_none()