"""
Database operations package for the collaboration system.

This package contains all database operations for collaboration entities.
"""

from .invite_db import (
    create_invite,
    get_invite,
    list_user_invites,
    accept_invite,
    decline_invite,
    check_duplicate_invite,
    CollaborationInviteDBError,
    CollaborationInviteNotFoundError,
    CollaborationInvitePermissionError,
    CollaborationInviteValidationError
)
from .collaborator_db import (
    list_collaborators,
    remove_collaborator,
    check_collaborator_access,
    list_user_collaborations,
    CollaborationDBError,
    CollaborationNotFoundError,
    CollaborationPermissionError
)
from .comment_db import (
    create_comment,
    get_comment,
    list_comments,
    update_comment,
    delete_comment,
    extract_mentions,
    CommentDBError,
    CommentNotFoundError,
    CommentPermissionError,
    CommentValidationError
)
from .reaction_db import (
    toggle_reaction,
    get_comment_reactions,
    ReactionDBError
)

__all__ = [
    # Invite operations
    "create_invite",
    "get_invite", 
    "list_user_invites",
    "accept_invite",
    "decline_invite",
    "check_duplicate_invite",
    "CollaborationInviteDBError",
    "CollaborationInviteNotFoundError",
    "CollaborationInvitePermissionError",
    "CollaborationInviteValidationError",
    
    # Collaborator operations
    "list_collaborators",
    "remove_collaborator",
    "check_collaborator_access",
    "list_user_collaborations",
    "CollaborationDBError",
    "CollaborationNotFoundError",
    "CollaborationPermissionError",
    
    # Comment operations
    "create_comment",
    "get_comment",
    "list_comments",
    "update_comment",
    "delete_comment",
    "extract_mentions",
    "CommentDBError",
    "CommentNotFoundError",
    "CommentPermissionError",
    "CommentValidationError",
    
    # Reaction operations
    "toggle_reaction",
    "get_comment_reactions",
    "ReactionDBError"
]

