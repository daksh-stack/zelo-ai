from sqlalchemy import String, ForeignKey, Integer, Float, DateTime, Text, JSON, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import uuid
import enum


class ExamStrategy(str, enum.Enum):
    full_pass = "full_pass"
    high_yield = "high_yield"


class ExamSessionStatus(str, enum.Enum):
    active = "active"
    completed = "completed"


class TopicImportance(str, enum.Enum):
    must_know = "must_know"
    should_know = "should_know"
    low_priority = "low_priority"


class TopicStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    covered = "covered"
    skipped = "skipped"


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)

    subject: Mapped[str] = mapped_column(String(100), nullable=False)
    exam_time: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    hours_available: Mapped[float] = mapped_column(Float, nullable=False)
    strategy: Mapped[ExamStrategy] = mapped_column(SAEnum(ExamStrategy), nullable=False)
    status: Mapped[ExamSessionStatus] = mapped_column(SAEnum(ExamSessionStatus), default=ExamSessionStatus.active)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    topics = relationship("ExamTopicPlan", back_populates="session", cascade="all, delete-orphan", order_by="ExamTopicPlan.order")


class ExamTopicPlan(Base):
    __tablename__ = "exam_topic_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("exam_sessions.id", ondelete="CASCADE"), index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_name: Mapped[str] = mapped_column(String(255), nullable=False)
    importance: Mapped[TopicImportance] = mapped_column(SAEnum(TopicImportance), nullable=False)
    allocated_minutes: Mapped[int] = mapped_column(Integer, default=30)
    order: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[TopicStatus] = mapped_column(SAEnum(TopicStatus), default=TopicStatus.pending)

    notes_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_formulas: Mapped[list | None] = mapped_column(JSON, nullable=True)
    likely_questions: Mapped[list | None] = mapped_column(JSON, nullable=True)

    covered_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    session = relationship("ExamSession", back_populates="topics")