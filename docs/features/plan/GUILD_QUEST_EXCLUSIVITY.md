# Guild Quest System - Exclusivity Documentation

## Summary

**Guild Quests are EXCLUSIVELY for guilds** - They are a completely separate system from user quests with no shared storage, APIs, or data access patterns.

**IMPORTANT**: The simplified model (quantitative and percentual only) applies **ONLY TO GUILD QUESTS**. User quests keep their existing model unchanged (linked, quantitative, manual, etc.).

## How Exclusivity is Achieved

### 1. Storage Isolation ✅
- **Guild Quests**: Stored in `gg_guild` table ONLY
  - Pattern: `PK=GUILD#{guildId}`, `SK=QUEST#{questId}`
- **User Quests**: Stored in `gg_core` table ONLY
  - Pattern: `PK=USER#{userId}`, `SK=QUEST#{questId}`
- **No Intersection**: Guild quest operations NEVER query `gg_core`
- **Type Field**: All guild quest items have `type: "GuildQuest"` for identification

### 2. API Isolation ✅
- **Guild Quest Endpoints**: `/guilds/{guild_id}/quests/*`
  - All operations are guild-scoped
  - Require guild membership verification
- **User Quest Endpoints**: `/quests/*`
  - All operations are user-scoped
  - Require user authentication
- **No Overlap**: Completely separate endpoint namespaces

### 3. Ownership Model ✅
- **Guild Quests**: Owned by guild entity
  - Created by: Guild owner or moderators
  - Managed by: Guild owner or moderators
  - Completed by: Guild members (multiple completions per quest)
- **User Quests**: Owned by individual users
  - Created by: User themselves
  - Managed by: User themselves
  - Completed by: User themselves (single completion per quest)

### 4. Data Access Patterns ✅

**Guild Quest Queries** (always use `gg_guild` table):
```python
# List all quests for a guild
PK = f"GUILD#{guildId}"
SK begins_with "QUEST#"

# Get specific quest
PK = f"GUILD#{guildId}"
SK = f"QUEST#{questId}"

# Get member's completion
PK = f"GUILD#{guildId}"
SK = f"MEMBER#{userId}#QUEST#{questId}"

# List member's completions (via GSI)
GSI2PK = f"USER#{userId}"
GSI2SK begins_with "QUEST#"
```

**User Quest Queries** (always use `gg_core` table):
```python
# List user's quests
PK = f"USER#{userId}"
SK begins_with "QUEST#"

# Get specific quest
PK = f"USER#{userId}"
SK = f"QUEST#{questId}"
```

**These patterns NEVER intersect** ✅

### 5. Completion Model ✅

**Guild Quests**:
- Multiple members can complete the same quest
- Each completion is tracked separately
- Quest stats aggregate all completions
- Completion record: `PK=GUILD#{guildId}`, `SK=MEMBER#{userId}#QUEST#{questId}`

**User Quests** (UNCHANGED - No modifications):
- Types: `linked`, `quantitative`, `manual` (all remain valid)
- Model remains exactly as designed in original quest service
- Only the owner can complete their quest
- Single completion per quest
- Completion updates quest status directly
- **No changes to user quest functionality or model**

### 6. Permission Model ✅

**Guild Quests**:
- **Create**: Owner or Moderator only
- **View**: Guild members only
- **Complete**: Guild members only (one completion per member per quest)
- **Edit/Delete**: Owner or Moderator only (draft quests only)

**User Quests**:
- **All Operations**: User themselves only (privacy settings apply)

## Implementation Checklist

When implementing guild quest operations, ensure:

- [ ] All database operations use `gg_guild` table
- [ ] No queries to `gg_core` table for guild quests
- [ ] All API endpoints use `/guilds/{guild_id}/quests/*` pattern
- [ ] All quest items have `type: "GuildQuest"` field
- [ ] Membership verification before allowing quest operations
- [ ] Role verification before allowing create/edit/delete
- [ ] Completion tracking is per-member (multiple completions per quest)
- [ ] Quest stats aggregate from completion records, not quest status

## Testing Exclusivity

To verify exclusivity:

1. **Storage Test**: Create a guild quest and verify it appears only in `gg_guild`, not in `gg_core`
2. **API Test**: Verify guild quest endpoints work independently from user quest endpoints
3. **Query Test**: Verify queries for guild quests never touch `gg_core` table
4. **Completion Test**: Verify multiple members can complete the same guild quest
5. **Permission Test**: Verify non-members cannot access guild quests

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    GUILD QUEST SYSTEM                   │
│                  (Exclusive to Guilds)                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Storage: gg_guild table ONLY                           │
│  ├─ Quest Items: GUILD#{guildId} / QUEST#{questId}      │
│  └─ Completion Items: GUILD#{guildId} / MEMBER#{userId} │
│                                                           │
│  APIs: /guilds/{guild_id}/quests/*                      │
│  ├─ Create, Read, Update, Delete, Complete             │
│  └─ All require guild membership                        │
│                                                           │
│  Access: Guild members only                             │
│  Management: Owner/Moderator only                       │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    USER QUEST SYSTEM                    │
│               (Completely Separate)                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Storage: gg_core table ONLY                            │
│  └─ Quest Items: USER#{userId} / QUEST#{questId}        │
│                                                           │
│  APIs: /quests/*                                        │
│  └─ Create, Read, Update, Delete, Complete              │
│                                                           │
│  Access: User themselves                                │
│  Management: User themselves                            │
│                                                           │
└─────────────────────────────────────────────────────────┘

⚠️ NO OVERLAP - These systems are completely isolated
```

