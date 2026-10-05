from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class PrefsUpdate(BaseModel):
    daily_reminder: Optional[bool] = None
    streak_risk: Optional[bool] = None
    challenge_updates: Optional[bool] = None
    reminder_hour: Optional[int] = Field(None, ge=0, le=23)
    timezone: Optional[str] = Field(None, max_length=64)


class PrefsOut(BaseModel):
    daily_reminder: bool
    streak_risk: bool
    challenge_updates: bool
    reminder_hour: int
    timezone: str

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: str
    kind: str
    title: str
    body: str
    href: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackIn(BaseModel):
    category: str = Field("general", max_length=40)
    message: str = Field(..., min_length=5, max_length=2000)
    page: Optional[str] = Field(None, max_length=120)


class FeedbackOut(BaseModel):
    id: str
    category: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class TrackEventIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    props: Optional[dict[str, Any]] = None


class AppConfigOut(BaseModel):
    environment: str
    reminder_enabled: bool
    app_public_url: str
    features: dict[str, bool]