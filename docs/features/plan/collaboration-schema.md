# Collaboration System DynamoDB Schema

## Overview

This document defines the DynamoDB schema for the collaboration system, extending the existing single-table design in the `gg_core` table. The collaboration system supports invitations, collaborators, threaded comments, and reactions for Goals, Quests, and Tasks.

## Table Information

- **Table Name**: `gg_core` (existing single-table design)
- **Primary Key**: `PK` (partition key), `SK` (sort key)
- **Global Secondary Index**: `GSI1` with `GSI1PK` and `GSI1SK`
- **TTL**: `ttl` attribute for automatic cleanup of expired invites

## Entity Definitions

### 1. CollaborationInvite

**Purpose**: Track invitations to collaborate on resources (Goals, Quests, Tasks)

**Primary Key Pattern**:
- `PK`: `RESOURCE#{resourceType}#{resourceId}` (e.g., `RESOURCE#GOAL#goal-123`)
- `SK`: `INVITE#{inviteId}` (e.g., `INVITE#inv-456`)

**GSI1 Pattern**:
- `GSI1PK`: `USER#{inviteeId}` (enables querying invites for a specific user)
- `GSI1SK`: `INVITE#{status}#{createdAt}` (e.g., `INVITE#pending#2024-01-15T10:30:00Z`)

**Attributes**:
```json
{
  "type": "CollaborationInvite",
  "inviteId": "inv-456",
  "inviterId": "user-123",
  "inviteeId": "user-789",
  "inviteeEmail": "collaborator@example.com",
  "resourceType": "goal",
  "resourceId": "goal-123",
  "status": "pending",
  "message": "Would you like to collaborate on this goal?",
  "expiresAt": "2024-02-14T10:30:00Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "ttl": 1708005000
}
```

**Access Patterns**:
1. List all invites for a resource: `Query PK=RESOURCE#{type}#{id} WHERE begins_with(SK, 'INVITE#')`
2. List user's received invites: `Query GSI1 WHERE GSI1PK=USER#{userId} AND begins_with(GSI1SK, 'INVITE#')`
3. Get specific invite: `GetItem PK=RESOURCE#{type}#{id}, SK=INVITE#{inviteId}`
4. List pending invites: `Query GSI1 WHERE GSI1PK=USER#{userId} AND GSI1SK begins_with 'INVITE#pending'`

### 2. Collaborator

**Purpose**: Track users who have accepted collaboration invitations

**Primary Key Pattern**:
- `PK`: `RESOURCE#{resourceType}#{resourceId}` (e.g., `RESOURCE#GOAL#goal-123`)
- `SK`: `COLLABORATOR#{userId}` (e.g., `COLLABORATOR#user-789`)

**GSI1 Pattern**:
- `GSI1PK`: `USER#{userId}` (enables querying resources a user collaborates on)
- `GSI1SK`: `COLLAB#{resourceType}#{joinedAt}` (e.g., `COLLAB#goal#2024-01-15T11:00:00Z`)

**Attributes**:
```json
{
  "type": "Collaborator",
  "userId": "user-789",
  "resourceType": "goal",
  "resourceId": "goal-123",
  "role": "collaborator",
  "joinedAt": "2024-01-15T11:00:00Z",
  "lastSeenAt": "2024-01-20T14:30:00Z"
}
```

**Access Patterns**:
1. List resource collaborators: `Query PK=RESOURCE#{type}#{id} WHERE begins_with(SK, 'COLLABORATOR#')`
2. List user's collaborations: `Query GSI1 WHERE GSI1PK=USER#{userId} AND begins_with(GSI1SK, 'COLLAB#')`
3. Check if user is collaborator: `GetItem PK=RESOURCE#{type}#{id}, SK=COLLABORATOR#{userId}`
4. List collaborations by type: `Query GSI1 WHERE GSI1PK=USER#{userId} AND begins_with(GSI1SK, 'COLLAB#goal')`

### 3. Comment

**Purpose**: Threaded discussions on resources

**Primary Key Pattern**:
- `PK`: `RESOURCE#{resourceType}#{resourceId}` (e.g., `RESOURCE#GOAL#goal-123`)
- `SK`: `COMMENT#{createdAt}#{commentId}` (e.g., `COMMENT#2024-01-15T12:00:00Z#cmt-456`)

**GSI1 Pattern** (for threading):
- `GSI1PK`: `COMMENT#{parentId}` (null for top-level comments)
- `GSI1SK`: `CREATED#{createdAt}` (e.g., `CREATED#2024-01-15T12:00:00Z`)

**Attributes**:
```json
{
  "type": "Comment",
  "commentId": "cmt-456",
  "parentId": null,
  "userId": "user-789",
  "text": "Great progress on this goal! @user-123 what do you think?",
  "mentions": ["user-123"],
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": null,
  "deletedAt": null,
  "editHistory": []
}
```

**Access Patterns**:
1. List comments for resource: `Query PK=RESOURCE#{type}#{id} WHERE begins_with(SK, 'COMMENT#')`
2. List replies to comment: `Query GSI1 WHERE GSI1PK=COMMENT#{parentId}`
3. Get specific comment: `GetItem PK=RESOURCE#{type}#{id}, SK=COMMENT#{timestamp}#{commentId}`
4. Paginated comments: Query with `LastEvaluatedKey` support

### 4. Reaction

**Purpose**: Emoji reactions on comments

**Primary Key Pattern**:
- `PK`: `COMMENT#{commentId}` (e.g., `COMMENT#cmt-456`)
- `SK`: `REACTION#{userId}#{emoji}` (e.g., `REACTION#user-123#👍`)

**Attributes**:
```json
{
  "type": "Reaction",
  "commentId": "cmt-456",
  "userId": "user-123",
  "emoji": "👍",
  "createdAt": "2024-01-15T12:30:00Z"
}
```

**Access Patterns**:
1. List reactions for comment: `Query PK=COMMENT#{commentId} WHERE begins_with(SK, 'REACTION#')`
2. Get user's reaction: `GetItem PK=COMMENT#{commentId}, SK=REACTION#{userId}#{emoji}`
3. Aggregate reactions: Client-side grouping by emoji

### 5. NotificationPreference

**Purpose**: User preferences for collaboration notifications

**Primary Key Pattern**:
- `PK`: `USER#{userId}` (e.g., `USER#user-123`)
- `SK`: `COLLAB_PREFS`

**Attributes**:
```json
{
  "type": "NotificationPreference",
  "userId": "user-123",
  "emailOnInvite": true,
  "emailOnComment": false,
  "emailOnMention": true,
  "emailOnReaction": false,
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

## TTL Strategy

- **CollaborationInvite**: Set `ttl` to 30 days from creation for automatic cleanup of expired invites
- **Other entities**: No TTL (persistent data)

## Capacity Planning

### Read Capacity Units (RCU)
- **CollaborationInvite**: ~1 RCU per query (small items)
- **Collaborator**: ~1 RCU per query (small items)
- **Comment**: ~2 RCU per query (larger text content)
- **Reaction**: ~1 RCU per query (small items)

### Write Capacity Units (WCU)
- **CollaborationInvite**: ~1 WCU per operation
- **Collaborator**: ~1 WCU per operation
- **Comment**: ~2 WCU per operation (larger text content)
- **Reaction**: ~1 WCU per operation

### Estimated Usage (per 1000 users)
- 10,000 invites per month
- 5,000 accepted collaborations per month
- 50,000 comments per month
- 100,000 reactions per month

## Item Size Considerations

- **CollaborationInvite**: ~500 bytes (well under 400KB limit)
- **Collaborator**: ~200 bytes (well under 400KB limit)
- **Comment**: ~2KB average (well under 400KB limit, even with 2000 char limit)
- **Reaction**: ~150 bytes (well under 400KB limit)

## Security Considerations

1. **Access Control**: All operations require authentication via Cognito JWT
2. **Resource Ownership**: Only resource owners can create invites
3. **Collaborator Access**: Only collaborators can comment/react
4. **Data Validation**: All text inputs sanitized for XSS prevention
5. **Audit Trail**: All modifications logged for security monitoring

## Migration Strategy

Since this extends the existing single-table design:
1. No schema changes required to DynamoDB table
2. New access patterns use existing GSI1
3. Backward compatible with existing entities
4. Gradual rollout possible with feature flags

