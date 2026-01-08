"""
Database package for quest-service.

This package provides database operations and helper functions
for Quest entities using DynamoDB single-table design.
"""

from .quest_db import (
    create_quest,
    get_quest,
    update_quest,
    change_quest_status,
    list_user_quests,
    delete_quest,
    get_quest_by_id,
    QuestDBError,
    QuestNotFoundError,
    QuestVersionConflictError,
    QuestPermissionError
)

__all__ = [
    "create_quest",
    "get_quest", 
    "update_quest",
    "change_quest_status",
    "list_user_quests",
    "delete_quest",
    "get_quest_by_id",
    "QuestDBError",
    "QuestNotFoundError",
    "QuestVersionConflictError",
    "QuestPermissionError"
]
