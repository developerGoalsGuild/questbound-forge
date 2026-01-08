"""
Models package for quest-service.

This module provides all Pydantic models for the quest-service organized
by domain for better separation of concerns and maintainability.
"""

# Task models
from .task import (
    TaskInput,
    TaskResponse,
    TaskUpdateInput
)

# Goal models
from .goal import (
    AnswerInput,
    AnswerOutput,
    GoalCreatePayload,
    GoalUpdatePayload,
    Milestone,
    GoalProgressResponse,
    GoalResponse,
    GoalWithAccessResponse
)


# Quest models
from .quest import (
    QuestCreatePayload,
    QuestUpdatePayload, 
    QuestCancelPayload,
    QuestResponse,
    QuestStatus,
    QuestDifficulty,
    QuestKind,
    QuestCountScope,
    QuestPrivacy,
    QUEST_CATEGORIES
)

__all__ = [
    # Existing models
    "TaskInput",
    "TaskResponse", 
    "TaskUpdateInput",
    "AnswerInput",
    "GoalCreatePayload",
    "AnswerOutput",
    "GoalUpdatePayload",
    "Milestone",
    "GoalProgressResponse",
    "GoalResponse",
    "GoalWithAccessResponse",
    # New Quest models
    "QuestCreatePayload",
    "QuestUpdatePayload", 
    "QuestCancelPayload",
    "QuestResponse",
    "QuestStatus",
    "QuestDifficulty",
    "QuestKind",
    "QuestCountScope",
    "QuestPrivacy",
    "QUEST_CATEGORIES"
]
