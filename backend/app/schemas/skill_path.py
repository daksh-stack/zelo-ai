from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.skill_path import InterviewDomain, InterviewSessionStatus


class RevisionCardOut(BaseModel):
    topic: str
    front: str
    back: str
    tag: Optional[str] = None
    source: str = "bank"


class QuickRevisionResponse(BaseModel):
    cards: List[RevisionCardOut]
    count: int


class StartInterviewRequest(BaseModel):
    domain: InterviewDomain = InterviewDomain.sde
    total_questions: int = Field(default=5, ge=3, le=10)


class InterviewQuestionOut(BaseModel):
    id: str
    order: int
    question: str


class InterviewSessionOut(BaseModel):
    id: str
    domain: InterviewDomain
    status: InterviewSessionStatus
    total_questions: int
    answered_count: int
    score_total: float
    questions: List[InterviewQuestionOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


class SubmitAnswerRequest(BaseModel):
    answer_id: str
    user_answer: str = Field(..., min_length=1)


class SubmitAnswerResponse(BaseModel):
    answer_id: str
    score: float
    feedback: str
    model_answer: str
    session_score_avg: float
    answered_count: int
    status: InterviewSessionStatus


class SocraticProbeRequest(BaseModel):
    topic_title: str = Field(..., min_length=2)
    notes_summary: Optional[str] = None


class SocraticProbeResponse(BaseModel):
    probes: List[dict]


class SocraticEvaluateRequest(BaseModel):
    question: str
    user_answer: str


class SocraticEvaluateResponse(BaseModel):
    ok: bool
    feedback: str