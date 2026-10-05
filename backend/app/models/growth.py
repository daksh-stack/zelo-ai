from sqlalchemy import String, ForeignKey, DateTime, Boolean, Text, Integer, Enum as SAEnum, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import uuid
import enum


class NotificationKind(str, enum.Enum):
    daily_reminder = "daily_reminder"
    streak_risk = "streak_risk"
    challenge = "challenge"
    system = "system"


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    daily_reminder: Mapped[bool] = mapped_column(Boolean, default=True)
    streak_risk: Mapped[bool] = mapped_column(Boolean, default=True)
    challenge_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    # local hour 0-23 when user wants the daily nudge (frontend stores preference; cron uses this)
    reminder_hour: Mapped[int] = mapped_column(Integer, default=20)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class InAppNotification(Base):
    __tablename__ = "in_app_notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[NotificationKind] = mapped_column(SAEnum(NotificationKind), default=NotificationKind.system)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    href: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FeedbackTicket(Base):
    __tablename__ = "feedback_tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category: Mapped[str] = mapped_column(String(40), default="general")  # bug | idea | exam | other
    message: Mapped[str] = mapped_column(Text, nullable=False)
    page: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(80), index=True)  # e.g. task_done, exam_rescue_start
    props: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())