# DynamoDB Single-Table Model (Core + Social/Groups + Hybrid Feed)

> This updates the original single-table spec to support **follows**, **groups**, **asynchronous chat**, and a **hybrid feed** (fan-in by default with selective fan-out for power users/groups). Mutations are Lambda-backed; queries use AppSync resolvers.

## Table
- **Name**: `gg_core`
- **PK/SK**: `PK` (partition), `SK` (sort)
- **TTL**: `ttl` (epoch seconds) for expirable items (e.g., old feed entries, temp locks)
- **Streams**: **enabled** (`NEW_AND_OLD_IMAGES`) to drive fan-out and notifications

## Global Secondary Indexes
- **GSI1**: `GSI1PK`, `GSI1SK` — **user-owned listings & reverse edges**
  - Used for user timelines (entities created by a user) **and** reverse lookup for followers
- **GSI2**: `GSI2PK`, `GSI2SK` — **unique nickname** / exact lookups
- **GSI3**: `GSI3PK`, `GSI3SK` — **unique email** / exact lookups

> Additional GSIs are optional (e.g., tags, due buckets) and can be added when access patterns require.

## Key Prefix Conventions
```
USER#<userId>      EMAIL#<email>       NICK#<nickname>
GOAL#<goalId>      TASK#<taskId>       GROUP#<groupId>
ROOM#<roomId>      ACTIVITY#<actorId>  FEED#<userId>
PROMO#<userId>     COUNTER#<entity>
```

---

## Entity Items

### 1) User Profile
- **Keys**: `PK=USER#<userId>`, `SK=PROFILE#<userId>`  
- **GSIs**:
  - `GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#User#<createdAtISO>`
  - `GSI2PK=NICK#<nickname>`, `GSI2SK=PROFILE#<userId>`
  - `GSI3PK=EMAIL#<email>`, `GSI3SK=PROFILE#<userId>`
- **Payload**: `type:"User"`, `id`, `nickname`, `email`, `fullName`, `language`, `tags:string[]`, `tier`, `createdAt`, `updatedAt`

### 2) Follow Edge (user → user)
Two items per relationship to support both directions efficiently.
- **Who I follow (forward edge)**
  - `PK=USER#<followerId>`, `SK=FOLLOWING#<followeeId>`
  - Optional timeline copy: `GSI1PK=USER#<followerId>`, `GSI1SK=ENTITY#Following#<tsISO>#<followeeId>`
  - Payload: `type:"Follow"`, `followerId`, `followeeId`, `createdAt`
- **Who follows me (reverse edge via GSI1)**
  - **Mirror index**: `GSI1PK=USER#<followeeId>`, `GSI1SK=FOLLOWER#<followerId>` (stored on the same item)
  - Enables: “list my followers” by single GSI1 query

> **Counters** (denormalized):  
> `PK=USER#<userId>`, `SK=COUNTER#FOLLOWERS` (and `#FOLLOWING`), fields: `count`, `updatedAt`

### 3) Group & Membership (Hybrid “projects → communities”)
- **Group metadata**
  - `PK=GROUP#<groupId>`, `SK=GROUP#<groupId>`
  - `type:"Group"`, `name`, `description`, `ownerId`, `tags:string[]`, `isPersistent:boolean`, `createdAt`, `updatedAt`
- **Membership (list members)**
  - `PK=GROUP#<groupId>`, `SK=MEMBER#<userId>`
  - Payload: `type:"GroupMember"`, `groupId`, `userId`, `role:"owner"|"admin"|"member"`, `joinedAt`
- **User → Groups (reverse)**
  - `GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#Group#<joinedAt>#<groupId>`  
  - Enables: “groups I’m in” by a single GSI1 query

### 4) Goals & Tasks (unchanged + clarifications)
- **Goal (owned by user)**: `PK=USER#<userId>`, `SK=GOAL#<goalId>`; `GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#Goal#<createdAt>`  
- **Task (under a goal)**:
  - Primary: `PK=GOAL#<goalId>`, `SK=TASK#<taskId>`
  - Optional listing copy for user timeline: `GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#Task#<dueAtISO>#<taskId>`

### 5) Activities (write-once, canonical)
Single source of truth for all social/feed events (posts, comments, goal updates).
- **Keys**: `PK=ACTIVITY#<actorId>`, `SK=TS#<tsISO>#<activityId>`
- **Payload**:
  - `type:"Activity"`, `activityId`, `actorId`, `verb:"post"|"comment"|"goal_update"|...`,
  - `objectType:"Goal"|"Task"|"Group"|"Post"`, `objectId`,
  - `previewText`, `media?:{s3Key,contentType,width,height}`, `tags:string[]`,
  - `createdAt`
- **Why**: supports **fan-in** reads (query recent activities for each followee, then merge in app)

### 6) Materialized Feed Items (for promoted power users/groups)
Only for users we enable **fan-out** to speed up reads.
- **Keys**: `PK=FEED#<followerId>`, `SK=TS#<tsISO>#<activityId>`
- **Payload**: `type:"FeedItem"`, `followerId`, `activityId`, `actorId`, `verb`, `objectType`, `objectId`, `previewText`, `createdAt`, `ttl` (e.g., 30–60 days)
- **Produced by**: Streams → Lambda fan-out **when the actor/group is promoted**

### 7) Promotion Flag (who should fan-out?)
- **Keys**: `PK=PROMO#<userId>`, `SK=PROMO#<userId>`
- **Payload**: `type:"Promotion"`, `userId`, `fanoutEnabled:boolean`, `reason:"followers"|"volume"`, `thresholds`, `updatedAt`

### 8) Quest (User-owned gamified actions)
- **Keys**: `PK=USER#<userId>`, `SK=QUEST#<questId>`
- **GSIs**:
  - `GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#Quest#<createdAtISO>`
- **Payload**: `type:"Quest"`, `id`, `userId`, `title`, `description?`, `difficulty:"easy"|"medium"|"hard"`, `rewardXp`, `status:"active"|"completed"|"cancelled"`, `tags:string[]`, `deadline?`, `kind:"linked"|"quantitative"`, `linkedGoalIds?:string[]`, `linkedTaskIds?:string[]`, `targetCount?`, `countScope?:"any"|"linked"`, `startAt?`, `periodSeconds?`, `createdAt`, `updatedAt`

### 9) Chat (asynchronous)
- **Room**: `PK=ROOM#<roomId>`, `SK=ROOM#<roomId>` — metadata (`type:"Room"`, `scope:"dm"|"group"`, `members:string[]`, `createdAt`)
- **Message**: `PK=ROOM#<roomId>`, `SK=MSG#<tsISO>#<messageId>` — (`type:"Message"`, `roomId`, `userId`, `text`, `createdAt`, optional `ttl`)

---

## Core Access Patterns

### Users & Follows
- **Who I follow**: `Query PK=USER#<me> WHERE begins_with(SK,'FOLLOWING#')`
- **Who follows me**: `Query GSI1 WHERE GSI1PK=USER#<me> AND begins_with(GSI1SK,'FOLLOWER#')`
- **Counts**: `GetItem PK=USER#<me>, SK=COUNTER#FOLLOWERS` (and `#FOLLOWING`)

### Groups
- **Get group**: `GetItem PK=GROUP#<id>, SK=GROUP#<id>`
- **List members**: `Query PK=GROUP#<id> WHERE begins_with(SK,'MEMBER#')`
- **Groups I’m in**: `Query GSI1 WHERE GSI1PK=USER#<me> AND begins_with(GSI1SK,'ENTITY#Group#')`

### Feed (Hybrid)
- **Fan-in read (default)**: for each followee `u` → `Query PK=ACTIVITY#u LIMIT 50`, merge/sort client-side (or in Lambda/app tier)
- **Fan-out read (promoted)**: `Query PK=FEED#<me> LIMIT 50`
- **Write activity**: write `Activity` once; Streams processor **optionally** replicates to `FeedItem` if the actor is promoted
- **TTL**: set on `FeedItem` to auto-trim storage

### Quests
- **List user quests**: `Query GSI1 WHERE GSI1PK=USER#<me> AND begins_with(GSI1SK,'ENTITY#Quest#')`
- **Get specific quest**: `GetItem PK=USER#<me>, SK=QUEST#<questId>`
- **Filter by linked goals/tasks**: Client-side filtering or future GSI patterns

### Chat
- **Send message**: `PutItem PK=ROOM#<roomId>, SK=MSG#<tsISO>#<id>`
- **Read history**: `Query PK=ROOM#<roomId> ORDER BY SK DESC LIMIT 50` (paginate)

---

## Lambda-Backed Mutations (AppSync → Lambda)

> All mutations validate auth (Lambda authorizer), perform idempotent writes, update counters, and emit domain events (EventBridge) as needed.

- **`followUser(followeeId)`**
  - Put `FOLLOWING` item; set GSI1 mirror attributes; update `COUNTER#FOLLOWING` for follower and `COUNTER#FOLLOWERS` for followee (with retry/backoff).
- **`unfollowUser(followeeId)`**
  - Delete `FOLLOWING` item; decrement counters safely (floor at 0).
- **`joinGroup(groupId)` / `leaveGroup(groupId)`**
  - Put/Delete `MEMBER#<userId>`; add/remove GSI1 listing; optional room membership update.
- **`postActivity(input)`**
  - Put `Activity` item; Streams triggers fan-out if `PROMO#actorId.fanoutEnabled==true`.
- **`createQuest(input)`** (Quest Service Lambda)
  - Put `Quest` item; validate ownership of linked goals/tasks; set GSI1 attributes
- **`cancelQuest(questId)`** (Quest Service Lambda)
  - Update `Quest` status to "cancelled" (immutable after creation)
- **`deleteQuest(questId)`** (Quest Service Lambda, admin-only)
  - Delete `Quest` item with admin authorization check
- **`sendMessage(roomId, text)`**
  - Put `Message` item (asynchronous chat).

> **Error handling**: wrap DDB calls with exponential backoff; write idempotency key on mutations (e.g., `requestId`) to guard retries.

---

## Hot-Key & Scale Considerations
- **Sharded followers** (if needed): encode shard in `GSI1PK=USER#<followeeId>#<shardN>` to spread reverse edge reads for very large accounts.
- **Batch fan-out**: Streams → SQS → Lambda (batch `BatchWriteItem`) with DLQ for resilience.
- **Capped feeds**: enforce per-user cap (e.g., last 500–1,000 items) + `ttl` for old items.
- **Media**: store in S3 (presigned URLs in `Activity/FeedItem`).

---

## Alignment with Existing Docs/Infra
- Keeps **single-table** and **GSI1–GSI3** intact; extends GSI1 usage for reverse edges and listings.
- Uses **Streams + Lambda** for **selective fan-out** only (power users/groups), minimizing cost.
- Fully compatible with **AppSync GraphQL** queries and **Lambda-backed mutations**.