# Guild Quest Model Design - Quantitative & Percentual Only

## Overview

**IMPORTANT**: This model applies **ONLY TO GUILD QUESTS**. User quests remain unchanged with their existing model (linked, quantitative, manual types, etc.).

Guild quests are **exclusively** quantitative and percentual types. Linked and manual quest types are removed from guild quests only.

## Quest Types

### 1. Quantitative Quest
**Type**: `quantitative`

**Description**: Guild-wide count-based quests where all members contribute to a shared target.

**What Can Be Counted**:
- **Goals OR Tasks** (creator chooses one):
  - Example: "Complete 50 goals" → Counts only goal completions
  - Example: "Complete 100 tasks" → Counts only task completions
  - Counts personal goals/tasks completed by any guild member (after they joined guild)
- **Guild Quest Completions**:
  - Example: "5 members complete quest X"
  - Counts how many members completed a specific guild quest

**Completion Model**: **Guild-wide (Option B)**
- All members contribute to the same counter
- Progress is collective across all guild members
- Quest completes when guild-wide total reaches target
- Each member's personal completions add to the guild total

**Data Model**:
```typescript
{
  kind: "quantitative",
  targetCount: number,  // Required: Total count needed
  countScope: "goals" | "tasks" | "guild_quest",  // What to count (choose ONE)
  targetQuestId?: string,  // Required if countScope is "guild_quest"
  currentCount: number,  // Guild-wide total (denormalized)
  periodDays?: number,  // Optional: Count within time window
  periodStartAt?: number,  // When period started (epoch ms)
}
```

**Example Scenarios**:
- "Complete 100 goals as a guild" → Counts only goal completions (countScope: "goals")
- "Complete 50 tasks as a guild" → Counts only task completions (countScope: "tasks")
- "5 members complete the 'Fitness Challenge' quest" → Count members who completed that specific quest (countScope: "guild_quest")
- "Complete 50 goals in 30 days" → Time-bound guild-wide count of goals only

### 2. Percentual Quest
**Type**: `percentual`

**Description**: Percentage-based quests that can be either individual or collective.

**Sub-Types**:
- **A. Goal/Task Completion Percentage** (Individual)
  - Member must complete X% of their linked goals/tasks
  - Example: "Complete 80% of your fitness goals"
  - Each member tracks their own percentage
  
- **B. Member Completion Percentage** (Collective)
  - X% of guild members must complete this quest
  - Example: "50% of members must complete this quest"
  - Tracks how many members have completed

**Completion Model**: **Both Options (Option C)**
- Individual mode: Each member completes when they reach their percentage
- Collective mode: Quest completes when guild reaches member completion percentage
- Creator selects mode when creating quest

**Data Model**:
```typescript
{
  kind: "percentual",
  percentualType: "goal_task_completion" | "member_completion",  // Required
  targetPercentage: number,  // Required: 0-100
  
  // For goal_task_completion type:
  linkedGoalIds?: string[],  // Optional: Specific goals to track
  linkedTaskIds?: string[],  // Optional: Specific tasks to track
  countScope?: "goals" | "tasks" | "both",  // What to calculate % from
  
  // For member_completion type:
  memberTotal?: number,  // Total guild members (denormalized)
  membersCompletedCount?: number,  // How many completed (denormalized)
  
  // Individual progress tracking
  memberProgress?: {  // Stored per member in completion records
    userId: string,
    currentPercentage: number,
    completedAt?: number,
  }[]
}
```

**Example Scenarios**:
- **Individual**: "Complete 75% of your fitness goals" → Each member tracks their own % of completed vs total goals
- **Individual**: "Complete 50% of your assigned tasks" → Member tracks their task completion %
- **Collective**: "30% of guild members must complete this quest" → Quest completes when 30% of members finish it

## Data Model Summary

### Guild Quest Base Structure
```typescript
interface GuildQuest {
  // Core fields
  questId: string;
  guildId: string;
  title: string;
  description?: string;
  difficulty: "easy" | "medium" | "hard";
  rewardXp: number;
  status: "draft" | "active" | "archived" | "cancelled";
  category: string;
  tags: string[];
  createdBy: string;  // Owner/moderator user ID
  createdAt: number;
  updatedAt: number;
  deadline?: number;
  
  // Quest type (ONLY quantitative or percentual)
  kind: "quantitative" | "percentual";
  
  // Quantitative fields (when kind === "quantitative")
  targetCount?: number;
  countScope?: "goals" | "tasks" | "guild_quest";  // Choose ONE (not both)
  targetQuestId?: string;  // Required if counting guild quest completions
  currentCount?: number;  // Guild-wide current total
  periodDays?: number;
  periodStartAt?: number;
  
  // Percentual fields (when kind === "percentual")
  percentualType?: "goal_task_completion" | "member_completion";
  targetPercentage?: number;  // 0-100
  linkedGoalIds?: string[];  // For goal_task_completion
  linkedTaskIds?: string[];  // For goal_task_completion
  countScope?: "goals" | "tasks" | "both";  // For goal_task_completion
  memberTotal?: number;  // For member_completion (denormalized)
  membersCompletedCount?: number;  // For member_completion (denormalized)
  
  // Completion tracking
  totalCompletions: number;  // Total completion records (for percentual individual)
  completedByCount: number;  // Unique members who completed
  lastCompletedAt?: number;
}
```

### Completion Record Structure
```typescript
interface GuildQuestCompletion {
  questId: string;
  userId: string;
  guildId: string;
  completedAt: number;
  rewardXp: number;
  
  // For quantitative quests:
  contributedCount?: number;  // How much this member contributed
  
  // For percentual quests:
  completionPercentage?: number;  // What % they reached
  linkedGoalsCompleted?: string[];  // Which goals they completed
  linkedTasksCompleted?: string[];  // Which tasks they completed
}
```

## Completion Logic

### Quantitative Quest Completion

**For "goals" scope**:
1. Track ONLY goal completions by guild members (after they joined)
2. Count from `gg_core` table: `PK=USER#{userId}`, `SK begins_with GOAL#`, `status='completed'`, `updatedAt >= joined_at`
3. Aggregate goal counts guild-wide
4. Quest completes when `currentCount >= targetCount`
5. All members can see guild-wide progress
6. Members can "complete" the quest once guild target is met (optional personal completion record)

**For "tasks" scope**:
1. Track ONLY task completions by guild members (after they joined)
2. Count from `gg_core` table: Query tasks by goal ID, then count completed tasks
3. Aggregate task counts guild-wide
4. Quest completes when `currentCount >= targetCount`
5. All members can see guild-wide progress
6. Members can "complete" the quest once guild target is met (optional personal completion record)

**For "guild_quest" scope**:
1. Track how many members completed the target guild quest
2. Count unique member completions of target quest
3. Quest completes when member count reaches `targetCount`
4. Automatically marks as complete when threshold met

**Period-based (if periodDays specified)**:
- Only count completions within `[periodStartAt, periodStartAt + periodDays]`
- Period starts when quest status changes to "active"
- If deadline passes before target met, quest fails (optional)

### Percentual Quest Completion

**For "goal_task_completion" type (Individual)**:
1. Each member tracks their own percentage:
   - Count completed goals/tasks from `linkedGoalIds`/`linkedTaskIds`
   - Calculate: `(completed / total) * 100`
2. Member can complete quest when their percentage >= `targetPercentage`
3. Each member creates their own completion record when they reach target
4. Quest shows aggregate stats (how many members completed, average percentage)

**For "member_completion" type (Collective)**:
1. Track how many unique members have completed this quest
2. Calculate: `(membersCompletedCount / memberTotal) * 100`
3. Quest automatically completes when percentage >= `targetPercentage`
4. All members benefit when threshold is reached
5. Members can still create individual completion records for tracking

## API Endpoints

All endpoints remain the same structure:
- `POST /guilds/{guild_id}/quests` - Create quest (specify kind: "quantitative" or "percentual")
- `GET /guilds/{guild_id}/quests` - List quests
- `POST /guilds/{guild_id}/quests/{quest_id}/complete` - Complete quest (behavior varies by type)

## Progress Tracking

### Quantitative Quest Progress
```typescript
{
  questId: string;
  currentCount: number;  // Guild-wide total
  targetCount: number;
  percentage: number;  // (currentCount / targetCount) * 100
  contributors: {  // Top contributors
    userId: string;
    contribution: number;  // How much they contributed
  }[];
  periodRemaining?: number;  // Days left if period-based
}
```

### Percentual Quest Progress (Individual)
```typescript
{
  questId: string;
  userId: string;
  currentPercentage: number;  // Member's personal percentage
  targetPercentage: number;
  completed: number;  // Goals/tasks completed
  total: number;  // Total goals/tasks
  isCompleted: boolean;
  completedAt?: number;
}
```

### Percentual Quest Progress (Collective)
```typescript
{
  questId: string;
  currentPercentage: number;  // % of members who completed
  targetPercentage: number;
  membersCompleted: number;
  memberTotal: number;
  isCompleted: boolean;  // Guild-wide completion
  memberCompletionStatus: {  // Each member's status
    userId: string;
    hasCompleted: boolean;
    completedAt?: number;
  }[];
}
```

## Separation from User Quests

**User Quest Model (UNCHANGED)**:
- User quests keep their existing model in `gg_core` table
- Types: `linked`, `quantitative`, `manual` (all remain valid)
- Owned by individual users
- Stored in `gg_core` with `PK=USER#{userId}`, `SK=QUEST#{questId}`
- APIs: `/quests/*`
- No changes to user quest functionality

**Guild Quest Model (THIS MODEL)**:
- Guild quests use simplified model in `gg_guild` table
- Types: **ONLY** `quantitative` and `percentual` (no linked, no manual)
- Owned by guild (created by owner/moderator)
- Stored in `gg_guild` with `PK=GUILD#{guildId}`, `SK=QUEST#{questId}`
- APIs: `/guilds/{guild_id}/quests/*`
- Different validation rules and completion logic

## Migration Notes

**Guild Quest Migration**:
- ❌ Remove "linked" quest type from guild quests
- ❌ Remove "manual" quest type from guild quests
- ✅ Keep "quantitative" but modify to be guild-wide only
- ✅ Add "percentual" as new type with two sub-modes
- Existing guild quests with invalid types should be archived or migrated

**User Quest Migration**:
- ✅ **NO CHANGES** - User quests remain exactly as they are
- All existing user quest types remain valid
- No migration needed for user quests

## Validation Rules

### Quantitative Quest Validation
- `kind` must be "quantitative"
- `targetCount` required (min: 1)
- `countScope` required: "goals" OR "tasks" OR "guild_quest" (choose ONE, not combined)
- If `countScope === "guild_quest"`, `targetQuestId` required
- If `countScope === "goals"` or `"tasks"`, counts only that type (not both)
- `periodDays` optional (min: 1 if provided)

### Percentual Quest Validation
- `kind` must be "percentual"
- `percentualType` required: "goal_task_completion" OR "member_completion"
- `targetPercentage` required (0-100)
- If `percentualType === "goal_task_completion"`:
  - At least one of `linkedGoalIds` or `linkedTaskIds` must be provided
  - `countScope` required: "goals", "tasks", or "both"
- If `percentualType === "member_completion"`:
  - No linked goals/tasks needed
  - Tracks member completion of the quest itself

