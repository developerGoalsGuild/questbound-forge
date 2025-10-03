# DynamoDB Single-Table Model (Core)

Purpose: a clear, shared model for all services using the core single-table in DynamoDB. This document defines keys, GSIs, entity item shapes, and access patterns that we will keep consistent across code, resolvers, and infra.

Table
- Name: `gg_core` (see `backend/infra/terraform/main.tf` module `ddb`)
- Primary key: `PK` (partition), `SK` (sort)
- TTL: `ttl` (epoch seconds) enabled for ephemeral/expirable items
- Streams: enabled (NEW_AND_OLD_IMAGES) for CDC when needed

Indexes
- GSI1: `GSI1PK`, `GSI1SK` — user-owned listings/timeline across entities
- GSI2: `GSI2PK`, `GSI2SK` — unique nickname lookups (and other exact-match lookups)
- GSI3: `GSI3PK`, `GSI3SK` — unique email lookups (and other exact-match lookups)`P
  
Notes:
- Only GSI1–GSI3 are provisioned in Terraform today (`backend/infra/terraform/modules/dynamodb_single_table/main.tf`). Additional GSIs can be added later if access patterns require them.

Key Prefix Conventions
- User: `USER#<userId>`
- Email: `EMAIL#<email>`
- Nickname: `NICK#<nickname>`
- Goal: `GOAL#<goalId>`
- Task: `TASK#<taskId>`
- Room (chat): `ROOM#<roomId>`
- Assist thread: `ASSIST#<threadId>`
- Offer/company/etc.: `OFFER#<offerId>`, `COMPANY#<companyId>` (future)

Entity Items (canonical examples)

User Profile
- Keys: `PK=USER#<userId>`, `SK=PROFILE#<userId>`
- GSIs:
  - `GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#User#<createdAtISO>` (user timeline/listings)
  - `GSI2PK=NICK#<nickname>`, `GSI2SK=PROFILE#<userId>` (unique nickname)
  - `GSI3PK=EMAIL#<email>`, `GSI3SK=PROFILE#<userId>` (unique email)
- Payload (camelCase aligns with GraphQL):
  - `type: "User"`, `id`, `nickname`, `email`, `fullName`, `birthDate?`, `status`, `country?`, `language?`, `gender?`, `pronouns?`, `bio?`, `tags: string[]`, `tier: "free"|"pro"`, `createdAt`, `updatedAt`

Email Uniqueness Lock
- Keys: `PK=EMAIL#<email>`, `SK=UNIQUE#USER>`
- Purpose: guard against duplicate accounts by email
- Payload: `type: "EmailUnique"`, `email`, `userId`, `createdAt`

Goal (owned by a user)
- Keys: `PK=USER#<userId>`, `SK=GOAL#<goalId>`
- GSIs: `GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#Goal#<createdAtISO>`
- Payload: `type: "Goal"`, `id`, `userId`, `title`, `description?`, `tags: string[]`, `createdAt`, `updatedAt`, `status`

Task (under a goal)
- Keys: `PK=GOAL#<goalId>`, `SK=TASK#<taskId>`
- Optional owner listing copy for fast user queries (if needed later): `PK=USER#<userId>`, `SK=TASK#<dueAtISO>#<taskId>` with `GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#Task#<dueAtISO>`
- Payload: `type: "Task"`, `id`, `goalId`, `userId`, `title`, `dueAt?`, `nlpPlan?`, `done: boolean`, `createdAt`, `updatedAt`

Milestone (under a goal, for future persistent storage)
- Keys: `PK=USER#<userId>`, `SK=MILESTONE#<goalId>#<milestoneId>`
- GSIs: `GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#Milestone#<createdAtISO>`
- Payload: `type: "Milestone"`, `id`, `goalId`, `userId`, `name`, `percentage`, `achieved: boolean`, `achievedAt?`, `description?`, `createdAt`, `updatedAt`

Chat Message (per room)
- Keys: `PK=ROOM#<roomId>`, `SK=MSG#<timestampISO>#<messageId>`
- Optional GSI1 for user timeline if required: `GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#Message#<timestampISO>`
- Payload: `type: "Message"`, `id`, `roomId`, `userId`, `text`, `createdAt`

Assistance Thread Message
- Keys: `PK=ASSIST#<threadId>`, `SK=MSG#<timestampISO>#<id>`
- Payload: `type: "AssistMsg"`, `threadId`, `userId`, `text`, `createdAt`

Offer (future)
- Keys: `PK=OFFER#<offerId>`, `SK=OFFER#<offerId>`
- Optional GSIs to be added if needed (e.g., by company, tag)
- Payload: `type: "Offer"`, `id`, `companyId`, `title`, `tags: string[]`, `createdAt`, `status`

Access Patterns (current)
- Get profile by `userId`: GetItem on `PK=USER#<userId>`, `SK=PROFILE#<userId>`
- Get profile by `email`: Query `GSI3` where `GSI3PK=EMAIL#<email>` → `PROFILE#...`
- Get profile by `nickname`: Query `GSI2` where `GSI2PK=NICK#<nickname>` → `PROFILE#...`
- List user goals: Query base table where `PK=USER#<userId>` with `begins_with(SK, 'GOAL#')`
- List tasks in a goal: Query base table where `PK=GOAL#<goalId>` with `begins_with(SK, 'TASK#')`
- List user entities timeline: Query `GSI1` where `GSI1PK=USER#<userId>` ordered by `GSI1SK`
- Chat history: Query base table where `PK=ROOM#<roomId>` ordered by `SK` with pagination

Access Patterns (future - milestone persistent storage)
- List goal milestones: Query base table where `PK=USER#<userId>` with `begins_with(SK, 'MILESTONE#<goalId>#')`
- List user milestones timeline: Query `GSI1` where `GSI1PK=USER#<userId>` with `begins_with(GSI1SK, 'ENTITY#Milestone#')`
- Get specific milestone: GetItem on `PK=USER#<userId>`, `SK=MILESTONE#<goalId>#<milestoneId>`

Conventions
- Attributes: use `PK`, `SK`, and `GSIxPK/GSIxSK` exactly; camelCase for domain fields
- Timestamps: ISO 8601 strings in `createdAt`/`updatedAt` and when embedded in SK/GSI keys
- Identifiers: `id` fields are ULID/UUID; prefix only in keys (`USER#…`, `GOAL#…`)
- Types: every item includes a `type` discriminator (e.g., `User`, `Goal`, `Task`)
- Ephemeral/expiring: set `ttl` for auto-expiration (e.g., tokens, temp messages)

Alignment with Current Code
- `backend/services/user-service/app/main.py` already writes profile items with `GSI1/2/3` as above and uses a separate `goalsguild_login_attempts` table for rate-limiting.
- AppSync resolvers under `backend/infra/terraform/resolvers/` expect `GSI2` (nicknames) and `GSI3` (emails) to exist and use `GSI1` for user-owned listings.

Future GSIs (optional, gated by need)
- GSI4: due buckets (`GSI4PK=DUE#YYYYMMDD`, `GSI4SK=<dueAtISO>#TASK#<taskId>`) for reminders/notifications
- GSI5: tag search (`GSI5PK=TAG#<tag>`, `GSI5SK=<entity>#<id>`) for discovery
- GSI6: org/company listings (`GSI6PK=COMPANY#<companyId>`, `GSI6SK=<entity>#<id>`) for admin views

Terraform Pointers
- Table and GSIs are defined in `backend/infra/terraform/modules/dynamodb_single_table/main.tf` and wired in `backend/infra/terraform/main.tf` as module `ddb` with `table_name = "gg_core"`.
- If a future access pattern requires another GSI, add attributes and a `global_secondary_index { ... }` block, then reflect it here.

