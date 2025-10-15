from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
# ---------- Request/response models ----------
class TaskInput(BaseModel):
    goalId: str = Field(..., description="ID of the goal to which the task belongs")
    title: str = Field(..., min_length=1, description="Title of the task")
    dueAt: int = Field(..., description="Task due date as epoch seconds")
    tags: List[str] = Field(..., description="Tags associated with the task")

    @field_validator("tags")
    def tags_must_not_be_empty(cls, v):
        if not v or not all(isinstance(tag, str) and tag.strip() for tag in v):
            raise ValueError("Tags must be a non-empty list of non-empty strings")
        return v

# TaskResponse model for GraphQL response
class TaskResponse(BaseModel):
    id: str
    goalId: str
    title: str
    dueAt: int
    status: str
    createdAt: int
    updatedAt: int
    tags: List[str]


class TaskUpdateInput(BaseModel):
    title: Optional[str] = Field(None, min_length=1, description="Title of the task")
    dueAt: Optional[int] = Field(None, description="Task due date as epoch seconds")
    status: Optional[str] = Field(None, description="Task status (active, completed, cancelled)")
    tags: Optional[List[str]] = Field(None, description="Tags associated with the task")

    @field_validator("tags")
    @classmethod
    def tags_must_not_be_empty(cls, v):
        if v is not None and (not v or not all(isinstance(tag, str) and tag.strip() for tag in v)):
            raise ValueError("Tags must be a non-empty list of non-empty strings")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in ["active", "completed", "cancelled","paused","archived"]:
            raise ValueError("Status must be one of: active, completed, cancelled")
        return v



class AnswerInput(BaseModel):
    key: str
    answer: Optional[str] = ""


class GoalCreatePayload(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    deadline: str
    answers: List[AnswerInput] = Field(default_factory=list)


class AnswerOutput(BaseModel):
    key: str
    answer: str


class GoalUpdatePayload(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    deadline: Optional[str] = None
    tags: Optional[List[str]] = None
    answers: Optional[List[AnswerInput]] = None
    status: Optional[str] = None


class Milestone(BaseModel):
    id: str
    name: str
    percentage: float
    achieved: bool
    achievedAt: Optional[int] = None
    description: Optional[str] = None


class GoalProgressResponse(BaseModel):
    goalId: str
    progressPercentage: float
    taskProgress: float
    timeProgress: float
    completedTasks: int
    totalTasks: int
    milestones: List[Milestone]
    lastUpdated: int
    isOverdue: bool
    isUrgent: bool


