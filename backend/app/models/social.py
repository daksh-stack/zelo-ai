from sqlalchemy import String, ForeignKey, DateTime, Enum as SAEnum, UniqueConstraint, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import uuid
import enum
import secrets


class FriendStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class Friendship(Base):
    __tablename__ = "friendships"
    __table_args__ = (
        UniqueConstraint("requester_id", "addressee_id", name="uq_friend_pair"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    requester_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    addressee_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[FriendStatus] = mapped_column(SAEnum(FriendStatus), default=FriendStatus.pending)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    responded_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Circle(Base):
    __tablename__ = "circles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    invite_code: Mapped[str] = mapped_column(String(8), unique=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CircleMember(Base):
    __tablename__ = "circle_members"
    __table_args__ = (
        UniqueConstraint("circle_id", "user_id", name="uq_circle_member"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    circle_id: Mapped[str] = mapped_column(String(36), ForeignKey("circles.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    joined_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


def new_invite_code() -> str:
    return secrets.token_hex(3).upper()  # 6 chars