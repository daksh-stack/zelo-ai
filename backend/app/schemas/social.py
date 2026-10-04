from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


class SocialMeUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=80)
    college: Optional[str] = Field(None, max_length=120)
    board_opt_in: Optional[bool] = None


class SocialMeOut(BaseModel):
    display_name: Optional[str]
    college: Optional[str]
    board_opt_in: bool


class FriendRequestIn(BaseModel):
    email: EmailStr


class FriendActionIn(BaseModel):
    accept: bool


class PersonOut(BaseModel):
    user_id: str
    display_name: str
    college: Optional[str] = None
    current_streak: int = 0
    longest_streak: int = 0
    total_xp: int = 0
    level: int = 1
    rank: Optional[int] = None
    is_me: Optional[bool] = None


class PendingOut(BaseModel):
    id: str
    user_id: str
    display_name: str
    status: str


class CreateCircleIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)


class JoinCircleIn(BaseModel):
    invite_code: str = Field(..., min_length=4, max_length=8)


class CircleOut(BaseModel):
    id: str
    name: str
    invite_code: str
    owner_id: str

    class Config:
        from_attributes = True