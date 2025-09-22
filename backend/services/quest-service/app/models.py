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



class AnswerInput(BaseModel):
    key: str
    answer: Optional[str] = ""


class GoalCreatePayload(BaseModel):
    title: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    deadline: str
    answers: List[AnswerInput] = Field(default_factory=list)


class AnswerOutput(BaseModel):
    key: str
    answer: str


class GoalResponse(BaseModel):
    id: str
    userId: str
    title: str
    description: str
    tags: List[str]
    answers: List[AnswerOutput]
    deadline: Optional[str]
    status: str
    createdAt: int
    updatedAt: int