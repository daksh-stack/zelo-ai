from sqlalchemy import String, ForeignKey, Integer, DateTime, Text, JSON, func, Enum as SAEnum, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import uuid
import enum


class InterviewDomain(str, enum.Enum):
    sde = "sde"
    backend = "backend"
    frontend = "frontend"
    dsa = "dsa"
    system_design = "system_design"


class InterviewSessionStatus(str, enum.Enum):
    active = "active"
    completed = "completed"


class QuickRevisionCard(Base):
    """Optional: store generated decks per user for history. Can also be ephemeral."""
    __tablename__ = "quick_revision_cards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)

    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    front: Mapped[str] = mapped_column(Text, nullable=False)   # prompt / question
    back: Mapped[str] = mapped_column(Text, nullable=False)    # answer / notes
    tag: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="bank")  # bank | weak_area

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)

    domain: Mapped[InterviewDomain] = mapped_column(SAEnum(InterviewDomain), nullable=False)
    status: Mapped[InterviewSessionStatus] = mapped_column(
        SAEnum(InterviewSessionStatus), default=InterviewSessionStatus.active
    )
    total_questions: Mapped[int] = mapped_column(Integer, default=5)
    answered_count: Mapped[int] = mapped_column(Integer, default=0)
    score_total: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)

    question: Mapped[str] = mapped_column(Text, nullable=False)
    model_answer: Mapped[str] = mapped_column(Text, nullable=False)
    user_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0–1
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())