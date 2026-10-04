from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.schemas.social import (
    SocialMeUpdate, SocialMeOut, FriendRequestIn, FriendActionIn,
    PersonOut, PendingOut, CreateCircleIn, JoinCircleIn, CircleOut,
)
from app.services.social_service import (
    _profile, update_social_me, send_friend_request, respond_friend,
    list_friends, pending_for_me, create_circle, join_circle, my_circles,
    circle_board, college_board, friends_board,
)

router = APIRouter(prefix="/social", tags=["Social"])


@router.get("/me", response_model=SocialMeOut)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    p = await _profile(db, current_user.id)
    if not p:
        return {"display_name": None, "college": None, "board_opt_in": False}
    return {
        "display_name": getattr(p, "display_name", None),
        "college": getattr(p, "college", None),
        "board_opt_in": bool(getattr(p, "board_opt_in", False)),
    }


@router.patch("/me", response_model=SocialMeOut)
async def patch_me(
    body: SocialMeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    p = await update_social_me(db, current_user.id, body.model_dump(exclude_unset=True))
    return {
        "display_name": p.display_name,
        "college": p.college,
        "board_opt_in": p.board_opt_in,
    }


@router.post("/friends/request", status_code=201)
async def friend_request(
    body: FriendRequestIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    f = await send_friend_request(db, current_user.id, body.email)
    return {"id": f.id, "status": f.status}


@router.post("/friends/{friendship_id}/respond")
async def friend_respond(
    friendship_id: str,
    body: FriendActionIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    f = await respond_friend(db, current_user.id, friendship_id, body.accept)
    return {"id": f.id, "status": f.status}


@router.get("/friends", response_model=list[PersonOut])
async def friends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await list_friends(db, current_user.id)


@router.get("/friends/pending", response_model=list[PendingOut])
async def pending(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await pending_for_me(db, current_user.id)


@router.post("/circles", response_model=CircleOut, status_code=201)
async def post_circle(
    body: CreateCircleIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_circle(db, current_user.id, body.name)


@router.post("/circles/join", response_model=CircleOut)
async def post_join(
    body: JoinCircleIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await join_circle(db, current_user.id, body.invite_code)


@router.get("/circles", response_model=list[CircleOut])
async def get_circles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await my_circles(db, current_user.id)


@router.get("/leaderboard")
async def leaderboard(
    scope: str = Query("friends", pattern="^(friends|college|circle)$"),
    circle_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if scope == "friends":
        rows = await friends_board(db, current_user.id)
    elif scope == "college":
        rows = await college_board(db, current_user.id)
    else:
        if not circle_id:
            raise HTTPException(400, "circle_id required for circle scope")
        rows = await circle_board(db, current_user.id, circle_id)
    return {"scope": scope, "rows": rows}