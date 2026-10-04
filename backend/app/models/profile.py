from sqlalchemy import String, Integer, ForeignKey, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from sqlalchemy import Boolean

import uuid

class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    branch: Mapped[str | None] = mapped_column(String(100), nullable=True)
    target_roles: Mapped[list | None] = mapped_column(JSON, nullable=True)
    daily_hours: Mapped[float | None] = mapped_column(nullable=True)
    skill_levels: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    weak_areas: Mapped[list | None] = mapped_column(JSON, nullable=True)
    preferred_style: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    display_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    college: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    board_opt_in: Mapped[bool] = mapped_column(Boolean, default=False)

    user = relationship("User", back_populates="profile")