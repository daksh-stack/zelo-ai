from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from app.models.habits import ChallengePeriod, ChallengeStatus, FocusSessionStatus


class FreezeResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_active_date: str
    freezes_remaining: int
    saved_day: str


class ChallengeOut(BaseModel):
    id: str
    code: str
    title: str
    description: str
    period: ChallengePeriod
    target: int
    progress: int
    xp_reward: int
    status: ChallengeStatus
    period_key: str
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class BadgeOut(BaseModel):
    code: str
    title: str
    description: str
    earned_at: Optional[datetime] = None
    earned: bool = True


class BadgeCatalogOut(BaseModel):
    earned: List[BadgeOut]
    locked: List[BadgeOut]


class StartFocusRequest(BaseModel):
    planned_minutes: int = Field(default=25, ge=15, le=90)


class FocusSessionOut(BaseModel):
    id: str
    planned_minutes: int
    status: FocusSessionStatus
    xp_multiplier: float
    xp_awarded: int
    started_at: datetime
    ended_at: Optional[datetime]

    class Config:
        from_attributes = True


class FinishFocusRequest(BaseModel):
    aborted: bool = False