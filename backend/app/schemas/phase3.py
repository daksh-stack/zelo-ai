from pydantic import BaseModel
from typing import Optional, List, Any


class MicroQuizOut(BaseModel):
    id: str
    task_id: Optional[str]
    question: str
    options: List[str]
    topic: Optional[str]


class AnswerQuizRequest(BaseModel):
    selected_index: int


class AnswerQuizResponse(BaseModel):
    id: str
    is_correct: bool
    score: float
    correct_index: int


class WeeklyReportOut(BaseModel):
    window_days: int
    days_planned: int
    completion_rate: float
    skip_rate: float
    quiz_accuracy: Optional[float]
    current_phase: Optional[int]
    roadmap_title: Optional[str]
    recommendations: List[str]
    can_advance_phase: bool


class AdvancePhaseOut(BaseModel):
    advanced: bool
    current_phase: int
    phase_title: Optional[str] = None
    message: Optional[str] = None