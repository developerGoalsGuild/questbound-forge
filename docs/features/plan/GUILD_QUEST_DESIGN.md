# Guild Quest Design Document

## Overview

**GUILD QUESTS ARE EXCLUSIVE TO GUILDS** - This system is completely separate from user quests.

Guild Quests are quests created by guild owners/moderators for guild members to complete. Unlike personal quests (owned by individual users), guild quests are:

### Key Exclusivity Principles:
1. **Storage Isolation**: All guild quest data stored EXCLUSIVELY in `gg_guild` table (never in `gg_core`)
2. **API Isolation**: All endpoints use `/guilds/{guild_id}/quests/*` (separate from `/quests/*`)
3. **Ownership Model**: Owned by the guild (not a specific user), created by owners/moderators
4. **Completion Model**: Multiple members can complete the same quest independently
5. **Access Control**: Only guild members can view/complete; only owners/moderators can create
6. **Data Separation**: No queries to `gg_core` table for any guild quest operations

## Data Model

### DynamoDB Storage Pattern
**Table**: `gg_guild` (EXCLUSIVE - Never use `gg_core` for guild quests)

#### Guild Quest Item
```
PK: GUILD#{guildId}
SK: QUEST#{questId}

Attributes:
- type: "GuildQuest"
- questId: string (UUID/ULID)
- guildId: string
- title: string (3-100 chars, sanitized)
- description?: string (max 500 chars, sanitized, XSS-protected)
- difficulty: "easy" | "medium" | "hard"
- rewardXp: number (default 50, min 0, max 1000)
- status: "draft" | "active" | "archived" | "cancelled"
- category: string (required, validated against predefined list)
- tags: string[] (default [], max 10 tags, each max 20 chars)
- createdBy: string (user ID of owner/moderator who created it)
- createdAt: number (epoch ms)
- updatedAt: number (epoch ms)
- deadline?: number (epoch ms)
- startedAt?: number (epoch ms) - when quest was activated
- archivedAt?: number (epoch ms)
  
# Quest Type Configuration
- kind: "linked" | "quantitative" | "manual"
  
# Linked Quest Fields (optional)
- linkedGoalIds?: string[] - Personal goals members can link to complete quest
- linkedTaskIds?: string[] - Tasks members can complete to progress quest
  
# Quantitative Quest Fields (optional)
- targetCount?: number - Required for quantitative quests
- countScope?: "completed_tasks" | "completed_goals" | "any"
- periodDays?: number - Counting window duration
  
# Completion Tracking (denormalized for quick access)
- totalCompletions: number (default 0)
- completedByCount: number (number of unique members who completed)
- lastCompletedAt?: number (epoch ms)
- completionStats?: {
    totalAttempts: number
    successRate: number (completed/attempted)
  }
```

#### Guild Quest Completion Item (Per Member)
```
PK: GUILD#{guildId}
SK: MEMBER#{userId}#QUEST#{questId}

Attributes:
- type: "GuildQuestCompletion"
- guildId: string
- questId: string
- userId: string
- username: string (denormalized)
- completedAt: number (epoch ms)
- rewardXp: number (reward earned)
- completionMethod: "auto" | "manual" (auto = linked goals/tasks, manual = admin marked)
- linkedGoalIds?: string[] (if used linked goals)
- linkedTaskIds?: string[] (if used linked tasks)
- notes?: string (optional completion notes)
```

#### GSI for Quest Access Patterns
```
GSI1: List quests by guild
- GSI1PK: GUILD#{guildId}
- GSI1SK: QUEST#{createdAt}#{questId}

GSI2: List member completions
- GSI2PK: USER#{userId}
- GSI2SK: QUEST#{completedAt}#{questId}
```

## Quest Types

### 1. Linked Quest
- Members link their personal goals/tasks to complete the quest
- Quest completes automatically when all linked items are completed
- Same linking rules as personal quests (member must own goals/tasks)
- Multiple members can complete the same quest independently

### 2. Quantitative Quest
- Members must complete a certain number of tasks/goals
- Counts completions within a specified time period
- Examples: "Complete 10 goals this month", "Finish 50 tasks in 7 days"
- Each member tracks their own count toward the target

### 3. Manual Quest
- Created by owner/moderator, completed manually by admin approval
- Members can submit completion requests
- Admin reviews and marks as complete
- Useful for subjective or non-trackable achievements

## Status Lifecycle

### Status Transitions
```
draft → active → archived
draft → cancelled
active → archived
active → cancelled
```

**Status Definitions:**
- **draft**: Quest is being created/edited (not visible to members yet)
- **active**: Quest is live and members can complete it
- **archived**: Quest is no longer active (historical record)
- **cancelled**: Quest was cancelled before going active

**Status Rules:**
- Only `draft` quests can be edited
- Only `active` quests can be completed by members
- `archived` and `cancelled` quests are read-only
- Owners/moderators can change status (except completion tracking)

## Permissions

### Quest Creation
- **Allowed**: Guild owner, guild moderators
- **Not Allowed**: Regular members, non-members
- **Validation**: Verify user role in guild before allowing creation

### Quest Completion
- **Allowed**: All guild members (for active quests)
- **Not Allowed**: Non-members, blocked members
- **Validation**: Verify membership status

### Quest Management (Edit/Delete/Archive)
- **Allowed**: Guild owner, guild moderators, quest creator
- **Not Allowed**: Regular members
- **Note**: Only `draft` quests can be edited/deleted

## Completion Tracking

### Individual Completion
Each member tracks their own completion:
- One completion record per member per quest
- Members can only complete each quest once
- Completion triggers reward XP award
- Completion adds entry to recent activities

### Quest-Level Stats
Aggregated statistics tracked on quest:
- Total number of completions
- Number of unique members who completed
- Last completion timestamp
- Success rate (completions / total members)

## API Endpoints

### Create Guild Quest
```
POST /guilds/{guild_id}/quests
Authorization: Owner/Moderator only
Body: GuildQuestCreatePayload
Response: GuildQuestResponse
```

### List Guild Quests
```
GET /guilds/{guild_id}/quests?status=active&limit=20&offset=0
Authorization: Member required
Query Params:
  - status: "all" | "active" | "draft" | "archived" (members see active/archived only)
  - limit: number (default 20)
  - offset: number (default 0)
Response: { quests: GuildQuest[], total: number }
```

### Get Guild Quest Details
```
GET /guilds/{guild_id}/quests/{quest_id}
Authorization: Member required
Response: GuildQuestResponse with completion status for current user
```

### Update Guild Quest
```
PUT /guilds/{guild_id}/quests/{quest_id}
Authorization: Owner/Moderator only
Body: GuildQuestUpdatePayload
Response: GuildQuestResponse
Validation: Only draft quests can be updated
```

### Delete/Archive Guild Quest
```
DELETE /guilds/{guild_id}/quests/{quest_id}
Authorization: Owner/Moderator only
Query Param: action="delete" | "archive" (default: delete)
Response: { success: boolean }
Validation: Draft quests can be deleted, active quests archived
```

### Complete Guild Quest (Member)
```
POST /guilds/{guild_id}/quests/{quest_id}/complete
Authorization: Member required
Body: GuildQuestCompletePayload (optional linkedGoalIds/linkedTaskIds)
Response: GuildQuestCompletionResponse
Validation: 
  - Quest must be active
  - Member must not have already completed it
  - For linked quests: verify linked items are completed
  - For quantitative: verify count target met
```

### Get Quest Completion Status
```
GET /guilds/{guild_id}/quests/{quest_id}/completions
Authorization: Member required (or Owner/Moderator for all members)
Query Params:
  - userId?: string (if owner/moderator, can filter by member)
  - limit: number (default 20)
Response: { 
  userCompletion?: GuildQuestCompletion,
  allCompletions?: GuildQuestCompletion[] (owner/moderator only),
  stats: { totalCompletions, successRate, ... }
}
```

### Get Member's Quest Progress
```
GET /guilds/{guild_id}/quests/{quest_id}/progress
Authorization: Member required
Response: {
  questId: string
  userId: string
  isCompleted: boolean
  completedAt?: number
  progress: {
    linkedGoals: { goalId, completed: boolean }[]
    linkedTasks: { taskId, completed: boolean }[]
    quantitativeProgress?: { currentCount, targetCount, percentage }
  }
}
```

## Pydantic Models

```python
class GuildQuestCreatePayload(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    difficulty: Literal["easy", "medium", "hard"] = Field(default="medium")
    rewardXp: int = Field(default=50, ge=0, le=1000)
    category: str = Field(..., description="Quest category")
    tags: List[str] = Field(default_factory=list, max_items=10)
    deadline: Optional[int] = Field(None, description="Deadline (epoch ms)")
    kind: Literal["linked", "quantitative", "manual"] = Field(default="linked")
    linkedGoalIds: Optional[List[str]] = None
    linkedTaskIds: Optional[List[str]] = None
    targetCount: Optional[int] = None
    countScope: Optional[Literal["completed_tasks", "completed_goals", "any"]] = None
    periodDays: Optional[int] = None

class GuildQuestResponse(BaseModel):
    questId: str
    guildId: str
    title: str
    description: Optional[str]
    difficulty: str
    rewardXp: int
    status: str
    category: str
    tags: List[str]
    createdBy: str
    createdAt: int
    updatedAt: int
    deadline: Optional[int]
    startedAt: Optional[int]
    kind: str
    linkedGoalIds: Optional[List[str]]
    linkedTaskIds: Optional[List[str]]
    targetCount: Optional[int]
    countScope: Optional[str]
    periodDays: Optional[int]
    totalCompletions: int
    completedByCount: int
    lastCompletedAt: Optional[int]
    # User-specific fields (if member)
    userCompletion: Optional["GuildQuestCompletionResponse"]
    userProgress: Optional[dict]

class GuildQuestCompletionPayload(BaseModel):
    linkedGoalIds: Optional[List[str]] = None
    linkedTaskIds: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=500)
    completionMethod: Literal["auto", "manual"] = Field(default="auto")

class GuildQuestCompletionResponse(BaseModel):
    questId: str
    userId: string
    username: str
    completedAt: int
    rewardXp: int
    completionMethod: str
    linkedGoalIds: Optional[List[str]]
    linkedTaskIds: Optional[List[str]]
```

## Frontend Components

### GuildQuestsTab Component
- Display list of active guild quests
- Filter by status (active/archived)
- Show quest cards with:
  - Quest title, description, difficulty
  - Reward XP
  - Completion stats (X of Y members completed)
  - User's completion status
  - Action buttons (View Details, Complete if eligible)

### GuildQuestCreateForm Component
- Form for owners/moderators to create quests
- Fields: title, description, difficulty, reward, category, tags, deadline
- Quest type selector (linked/quantitative/manual)
- Conditional fields based on quest type
- Validation and submission

### GuildQuestDetailsModal Component
- Full quest details view
- Shows completion requirements
- Progress tracking (for quantitative quests)
- List of members who completed
- Completion button (if member hasn't completed)
- Edit/Archive buttons (if owner/moderator)

## Exclusivity Guarantees

### Storage Guarantee
- **All guild quest data** is stored in `gg_guild` table only
- `gg_core` table is **never queried** for guild quest operations
- No shared storage patterns between user quests and guild quests

### API Guarantee
- All guild quest endpoints: `/guilds/{guild_id}/quests/*`
- User quest endpoints remain: `/quests/*`
- No endpoint overlap or shared logic

### Query Patterns
- Guild quests: Query `gg_guild` with `PK=GUILD#{guildId}`, `SK begins_with QUEST#`
- User quests: Query `gg_core` with `PK=USER#{userId}`, `SK begins_with QUEST#`
- **These patterns never intersect**

## Integration Points

### Recent Activities
When a guild quest is:
- **Created**: Add activity `{ type: "quest_created", actorId, questId, questTitle }`
- **Completed by member**: Add activity `{ type: "quest_completed", actorId, questId, questTitle }`

### Analytics
Track guild quest metrics:
- Total guild quests created
- Total quest completions by members
- Quest completion rate (completions / total members)
- Most completed quests
- Member quest engagement score

### Member Activity Rate
Include guild quest completions in member activity calculation:
- Quest completion weight: 40% of activity score
- Each quest completion = +X points
- Difficulty multiplier (easy=1x, medium=1.5x, hard=2x)

## Validation Rules

### Creation Rules
- Title: 3-100 characters, sanitized
- Description: max 500 characters, sanitized, XSS-protected
- Category: must be from predefined list
- Tags: max 10 tags, each max 20 characters
- Linked goals: member must own the goals
- Reward XP: 0-1000, default 50
- Deadline: must be in the future if provided

### Completion Rules
- Quest must be `active`
- Member must be active guild member
- Member must not have already completed quest
- For linked quests: all linked items must be completed
- For quantitative: target count must be met
- Completion timestamp must be after quest `startedAt`

## Error Handling

### Common Errors
- `GUILD_QUEST_NOT_FOUND`: Quest doesn't exist
- `GUILD_QUEST_NOT_ACTIVE`: Quest is not in active status
- `GUILD_QUEST_ALREADY_COMPLETED`: Member already completed this quest
- `GUILD_QUEST_PERMISSION_DENIED`: User doesn't have permission
- `GUILD_QUEST_INVALID_STATUS`: Cannot perform action on current status
- `GUILD_QUEST_COMPLETION_REQUIREMENTS_NOT_MET`: Linked items not completed

## Future Enhancements (Out of Scope)
- Quest chains (quests that unlock other quests)
- Team quests (multiple members must collaborate)
- Quest templates (reusable quest structures)
- Quest categories and filtering
- Quest difficulty auto-calculation
- Quest leaderboards
- Quest notifications

