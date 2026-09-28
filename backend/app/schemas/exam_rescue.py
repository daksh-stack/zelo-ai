from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from app.models.exam_rescue import ExamStrategy, ExamSessionStatus, TopicImportance, TopicStatus


class CreateExamSessionRequest(BaseModel):
    subject: str = Field(..., min_length=2, max_length=100)
    exam_time: datetime
    hours_available: float = Field(..., ge=1, le=16)
    strategy: ExamStrategy


class ExamTopicResponse(BaseModel):
    id: str
    title: str
    unit_name: str
    importance: TopicImportance
    allocated_minutes: int
    order: int
    status: TopicStatus
    notes_summary: Optional[str]
    key_formulas: Optional[List[Any]]
    likely_questions: Optional[List[Any]]
    covered_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExamSessionResponse(BaseModel):
    id: str
    subject: str
    exam_time: datetime
    hours_available: float
    strategy: ExamStrategy
    status: ExamSessionStatus
    created_at: datetime
    topics: List[ExamTopicResponse]

    class Config:
        from_attributes = True


class UpdateTopicStatusRequest(BaseModel):
    status: TopicStatus


class RevisionSheetResponse(BaseModel):
    session_id: str
    subject: str
    exam_time: datetime
    strategy: str
    covered_count: int
    skipped_count: int
    pending_count: int
    covered_titles: List[str]
    skipped_titles: List[str]
    formulas: List[Any]
    top_questions: List[Any]
    generated_at: datetime