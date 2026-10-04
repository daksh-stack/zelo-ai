from datetime import datetime, timezone
from sqlalchemy import select, or_, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.user import User
from app.models.profile import Profile
from app.models.gamification import Streak, UserXP
from app.models.social import (
    Friendship, FriendStatus, Circle, CircleMember, new_invite_code,
)

MAX_CIRCLE = 8


def _label(user: User, profile: Profile | None) -> str:
    if profile and profile.display_name:
        return profile.display_name
    if getattr(user, "full_name", None):
        return user.full_name
    return (user.email or "cadet").split("@")[0]


async def _profile(db: AsyncSession, user_id: str) -> Profile | None:
    r = await db.execute(select(Profile).where(Profile.user_id == user_id))
    return r.scalar_one_or_none()


async def _user_by_email(db: AsyncSession, email: str) -> User | None:
    r = await db.execute(select(User).where(User.email == email.lower().strip()))
    return r.scalar_one_or_none()


async def stats_for(db: AsyncSession, user_id: str) -> dict:
    r = await db.execute(select(Streak).where(Streak.user_id == user_id))
    s = r.scalar_one_or_none()
    r = await db.execute(select(UserXP).where(UserXP.user_id == user_id))
    x = r.scalar_one_or_none()
    return {
        "current_streak": s.current_streak if s else 0,
        "longest_streak": s.longest_streak if s else 0,
        "total_xp": x.total_xp if x else 0,
        "level": x.level if x else 1,
    }


async def update_social_me(db: AsyncSession, user_id: str, data: dict) -> Profile:
    p = await _profile(db, user_id)
    if not p:
        raise HTTPException(400, "Complete onboarding first")
    if "display_name" in data and data["display_name"] is not None:
        p.display_name = data["display_name"].strip()[:80]
    if "college" in data and data["college"] is not None:
        p.college = data["college"].strip()[:120] or None
    if "board_opt_in" in data and data["board_opt_in"] is not None:
        p.board_opt_in = bool(data["board_opt_in"])
    await db.commit()
    await db.refresh(p)
    return p


async def send_friend_request(db: AsyncSession, me: str, email: str) -> Friendship:
    other = await _user_by_email(db, email)
    if not other:
        raise HTTPException(404, "No user with that email")
    if other.id == me:
        raise HTTPException(400, "Cannot friend yourself")

    r = await db.execute(
        select(Friendship).where(
            or_(
                and_(Friendship.requester_id == me, Friendship.addressee_id == other.id),
                and_(Friendship.requester_id == other.id, Friendship.addressee_id == me),
            )
        )
    )
    existing = r.scalar_one_or_none()
    if existing:
        if existing.status == FriendStatus.accepted:
            raise HTTPException(400, "Already friends")
        if existing.status == FriendStatus.pending:
            raise HTTPException(400, "Request already pending")
        existing.status = FriendStatus.pending
        existing.requester_id = me
        existing.addressee_id = other.id
        existing.responded_at = None
        await db.commit()
        await db.refresh(existing)
        return existing

    f = Friendship(requester_id=me, addressee_id=other.id, status=FriendStatus.pending)
    db.add(f)
    await db.commit()
    await db.refresh(f)
    return f


async def respond_friend(db: AsyncSession, me: str, friendship_id: str, accept: bool) -> Friendship:
    r = await db.execute(select(Friendship).where(Friendship.id == friendship_id))
    f = r.scalar_one_or_none()
    if not f or f.addressee_id != me:
        raise HTTPException(404, "Request not found")
    if f.status != FriendStatus.pending:
        raise HTTPException(400, "Already handled")
    f.status = FriendStatus.accepted if accept else FriendStatus.declined
    f.responded_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(f)
    return f


async def friend_ids(db: AsyncSession, me: str) -> list[str]:
    r = await db.execute(
        select(Friendship).where(
            Friendship.status == FriendStatus.accepted,
            or_(Friendship.requester_id == me, Friendship.addressee_id == me),
        )
    )
    out = []
    for f in r.scalars().all():
        out.append(f.addressee_id if f.requester_id == me else f.requester_id)
    return out


async def list_friends(db: AsyncSession, me: str) -> list[dict]:
    ids = await friend_ids(db, me)
    rows = []
    for uid in ids:
        r = await db.execute(select(User).where(User.id == uid))
        u = r.scalar_one()
        p = await _profile(db, uid)
        st = await stats_for(db, uid)
        rows.append({"user_id": uid, "display_name": _label(u, p), "college": p.college if p else None, **st})
    rows.sort(key=lambda x: (-x["current_streak"], -x["total_xp"]))
    return rows


async def pending_for_me(db: AsyncSession, me: str) -> list[dict]:
    r = await db.execute(
        select(Friendship).where(
            Friendship.addressee_id == me,
            Friendship.status == FriendStatus.pending,
        )
    )
    out = []
    for f in r.scalars().all():
        u = (await db.execute(select(User).where(User.id == f.requester_id))).scalar_one()
        p = await _profile(db, f.requester_id)
        out.append({
            "id": f.id,
            "user_id": f.requester_id,
            "display_name": _label(u, p),
            "status": f.status,
        })
    return out


async def create_circle(db: AsyncSession, me: str, name: str) -> Circle:
    c = Circle(owner_id=me, name=name.strip()[:80], invite_code=new_invite_code())
    db.add(c)
    await db.flush()
    db.add(CircleMember(circle_id=c.id, user_id=me))
    await db.commit()
    await db.refresh(c)
    return c


async def join_circle(db: AsyncSession, me: str, code: str) -> Circle:
    r = await db.execute(select(Circle).where(Circle.invite_code == code.strip().upper()))
    c = r.scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Invalid invite code")
    r = await db.execute(
        select(func.count()).select_from(CircleMember).where(CircleMember.circle_id == c.id)
    )
    if (r.scalar() or 0) >= MAX_CIRCLE:
        raise HTTPException(400, "Circle is full (8)")
    r = await db.execute(
        select(CircleMember).where(CircleMember.circle_id == c.id, CircleMember.user_id == me)
    )
    if r.scalar_one_or_none():
        return c
    db.add(CircleMember(circle_id=c.id, user_id=me))
    await db.commit()
    await db.refresh(c)
    return c


async def my_circles(db: AsyncSession, me: str) -> list[Circle]:
    r = await db.execute(
        select(Circle).join(CircleMember, CircleMember.circle_id == Circle.id).where(
            CircleMember.user_id == me
        )
    )
    return r.scalars().all()


async def circle_board(db: AsyncSession, me: str, circle_id: str) -> list[dict]:
    r = await db.execute(
        select(CircleMember).where(CircleMember.circle_id == circle_id, CircleMember.user_id == me)
    )
    if not r.scalar_one_or_none():
        raise HTTPException(403, "Not in this circle")
    r = await db.execute(select(CircleMember).where(CircleMember.circle_id == circle_id))
    members = []
    for m in r.scalars().all():
        u = (await db.execute(select(User).where(User.id == m.user_id))).scalar_one()
        p = await _profile(db, m.user_id)
        st = await stats_for(db, m.user_id)
        members.append({"user_id": m.user_id, "display_name": _label(u, p), **st})
    members.sort(key=lambda x: (-x["current_streak"], -x["total_xp"]))
    for i, row in enumerate(members, start=1):
        row["rank"] = i
    return members


async def college_board(db: AsyncSession, me: str) -> list[dict]:
    p = await _profile(db, me)
    if not p or not p.college or not p.board_opt_in:
        raise HTTPException(400, "Set college and opt in to the board first")
    r = await db.execute(
        select(Profile).where(
            Profile.college == p.college,
            Profile.board_opt_in == True,
        )
    )
    rows = []
    for pr in r.scalars().all():
        u = (await db.execute(select(User).where(User.id == pr.user_id))).scalar_one()
        st = await stats_for(db, pr.user_id)
        rows.append({"user_id": pr.user_id, "display_name": _label(u, pr), "college": pr.college, **st})
    rows.sort(key=lambda x: (-x["current_streak"], -x["total_xp"]))
    for i, row in enumerate(rows[:50], start=1):
        row["rank"] = i
    return rows[:50]


async def friends_board(db: AsyncSession, me: str) -> list[dict]:
    ids = [me] + await friend_ids(db, me)
    rows = []
    for uid in ids:
        u = (await db.execute(select(User).where(User.id == uid))).scalar_one()
        p = await _profile(db, uid)
        st = await stats_for(db, uid)
        rows.append({"user_id": uid, "display_name": _label(u, p), "is_me": uid == me, **st})
    rows.sort(key=lambda x: (-x["current_streak"], -x["total_xp"]))
    for i, row in enumerate(rows, start=1):
        row["rank"] = i
    return rows