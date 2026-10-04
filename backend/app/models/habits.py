from sqlalchemy import String, ForeignKey, Integer, DateTime, Text, Boolean, Float, Date, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import uuid
import enum


class ChallengePeriod(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"


class ChallengeStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    expired = "expired"


class FocusSessionStatus(str, enum.Enum):
    running = "running"
    completed = "completed"
    aborted = "aborted"


class StreakFreezeLog(Base):
    __tablename__ = "streak_freeze_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    used_on: Mapped[Date] = mapped_column(Date, nullable=False)  # missed day that was saved
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)

    code: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. daily_finish_all
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    period: Mapped[ChallengePeriod] = mapped_column(SAEnum(ChallengePeriod), nullable=False)
    target: Mapped[int] = mapped_column(Integer, default=1)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    xp_reward: Mapped[int] = mapped_column(Integer, default=20)
    status: Mapped[ChallengeStatus] = mapped_column(SAEnum(ChallengeStatus), default=ChallengeStatus.active)
    period_key: Mapped[str] = mapped_column(String(20), index=True)  # 2026-09-29 or 2026-W40

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    earned_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    planned_minutes: Mapped[int] = mapped_column(Integer, default=25)
    status: Mapped[FocusSessionStatus] = mapped_column(SAEnum(FocusSessionStatus), default=FocusSessionStatus.running)
    xp_multiplier: Mapped[float] = mapped_column(Float, default=1.25)
    xp_awarded: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ended_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)