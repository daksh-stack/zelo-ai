from sqlalchemy import String, ForeignKey, Integer, DateTime, Text, JSON, Float, func, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import uuid
import enum


class QuizKind(str, enum.Enum):
    task_micro = "task_micro"
    weekly = "weekly"


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    task_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)

    kind: Mapped[QuizKind] = mapped_column(SAEnum(QuizKind), default=QuizKind.task_micro)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list | None] = mapped_column(JSON, nullable=True)  # list[str] or null for short answer
    correct_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_correct: Mapped[bool | None] = mapped_column(nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    topic: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    answered_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)