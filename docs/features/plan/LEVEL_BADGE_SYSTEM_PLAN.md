# Level & Badge Data Model Notes

## DynamoDB Entities
- `PK=USER#{userId} SK=XP#SUMMARY` — snapshot totals (`totalXp`, `currentLevel`, thresholds, `xpProgress`, timestamps) plus `GSI1PK=XP#ALL` for leaderboard sorting via `GSI1SK={totalXp:020d}#{userId}`.
- `PK=USER#{userId} SK=LEVEL#EVENT#{timestamp}` — append-only level milestone records with `level`, `deltaXp`, `awardedAt`; feed DynamoDB Streams → EventBridge if future fan-out needed.
- `PK=USER#{userId} SK=BADGE#{badgeId}` — earned badge instances with `metadata`, `progress`, and `GSI1PK=BADGE#{badgeId}` to power badge leaderboards and catalog stats.
- `PK=BADGE#{badgeId} SK=METADATA` — badge definitions describing `category`, `rarity`, `icon`, and `criteria` (level thresholds, quest completions, streaks, challenge wins).

## GraphQL Contracts
- `type LevelProgress { totalXp: Int! currentLevel: Int! xpForCurrentLevel: Int! xpForNextLevel: Int! xpProgress: Float! earnedAt: AWSTimestamp! }`
- `type LevelEvent { level: Int! totalXp: Int! awardedAt: AWSTimestamp! source: String }`
- `type BadgeDefinition { id: ID! name: String! description: String! icon: String category: String! rarity: String! criteria: AWSJSON }`
- `type UserBadge { badgeId: ID! earnedAt: AWSTimestamp! progress: Float metadata: AWSJSON definition: BadgeDefinition! }`
- Queries:
  - `myLevelProgress` → Gamification service `/levels/me`.
  - `myLevelHistory(limit, after)` → `/levels/history`.
  - `myBadges` → `/badges/me`.
  - `badgeCatalog(category, rarity)` → `/badges/catalog`.

## Access Patterns
1. **Profile load**: fetch XP summary + level progress + earned badges in one AppSync request; use `USER#{userId}` partition items.
2. **Badge catalog**: scan `PK=BADGE#{badgeId}` definitions, optionally filter by category/rarity; TTL, icon metadata stored with definition.
3. **Badge leaderboards**: `GSI1PK=BADGE#{badgeId}` sorted by `earnedAt` to highlight newest earners.
4. **Level history**: query `PK=USER#{userId} SK begins_with LEVEL#EVENT#` descending for timeline.

## API Expectations
- FastAPI routes deliver structured JSON matching GraphQL types, enforcing JWT auth plus internal key for mutation-style endpoints (`/badges/evaluate`, `/xp/award`).
- Services log with `common.logging` and propagate `level_up` + `quest_completed` events into `badge_service`.

## Testing
- Backend: pytest coverage for new services (`test_level_service.py`, `test_level_routes.py`, `test_badge_routes.py`).
- Frontend: Vitest component tests for `XPDisplay`, `BadgeDisplay`.
- Selenium: `test/seleniumGridTests.js` scenario verifying XP increase + badge render; orchestrated via `scripts/run-selenium-tests-level-badge.ps1`.

