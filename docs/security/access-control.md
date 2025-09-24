API Authentication and Access Control

Overview
- AppSync default auth: Lambda authorizer (full user authentication).
- Additional auth: API Key enabled in dev to allow limited public queries.
- REST user-service: unauthenticated for signup/login; authenticated (Bearer) for all other endpoints.

Public Search (API Key Only)
- Queries: `isEmailAvailable(email)`, `isNicknameAvailable(nickname)`.
- Schema directives: both are annotated with `@aws_api_key`.
- Client: frontend uses `authMode: 'apiKey'` for these queries.
- Purpose: allow pre-signup checks without user authentication.

Protected Operations (User Auth Required)
- GraphQL: all other fields/mutations (e.g., `createGoal`, `addTask`, `goals`, `tasks`, `messages`, etc.).
- Default auth: Lambda authorizer validates user token; resolvers access `ctx.identity.sub`.
- Example enforcement:
  - `createGoal`: denies if `ctx.identity.sub` is missing.
  - `goals(userId: ID!)`: resolver `getGoals.js` denies when `identity.sub` != `args.userId`.
  - `activeGoalsCount(userId: ID!)`: resolver `activeGoalsCount.js` enforces same-user and filters to `status = 'active'`.
  - `tasks(goalId: ID!)`: resolver `getTasks.js` requires auth and filters by `ownerId = identity.sub`.
- Client: protected calls use Amplify GraphQL client default auth (configured to `lambda`). No API key is used.

REST Endpoints
- `/users/signup`: unauthenticated. Accepts provider, email, password, and metadata to create an account.
- `/users/login`: unauthenticated. Issues tokens on valid credentials.
- All other REST routes (e.g., `/password/change`, `/auth/renew`): require `Authorization: Bearer <token>`; frontend uses `authFetch` to inject tokens and renew on expiry.

User Data Isolation
- Resolvers validate the current user’s identity (`ctx.identity.sub`) and constrain DynamoDB access by partition key (for example, `PK = USER#<sub>` for goals, `PK = GOAL#<goalId>` plus `ownerId` filter for tasks).
- Clients derive IDs from the JWT (not from user input) to prevent horizontal privilege escalation.

Amplify Configuration
- `frontend/src/config/aws-exports.*.ts` sets `defaultAuthMode: 'lambda'` and provides `apiKey` for the limited public queries.
- `generateClient()` is used per call; search queries pass `authMode: 'apiKey'`, while protected operations rely on default auth.

Security Rationale
- API Key is limited to non-sensitive checks (existence of email/nickname), preventing data leakage.
- All data-bearing operations require user tokens, and resolvers re-validate identity before accessing storage.
- Tokens are short-lived and renewed proactively; failed renew clears local session.

Operational Notes
- Dev feature flag `VITE_ENABLE_EMAIL_CONFIRMATION`: when disabled, the frontend may allow dev logins for accounts pending confirmation (for velocity only). Do not enable this in production.
- AppSync API key (`enable_appsync_api_key`) is turned on for dev in `backend/infra/terraform/environments/dev.tfvars`. For production, scope and rotate the key, or disable if not needed.

Audit Checklist
- Ensure AppSync API has default auth (Lambda/Cognito) and additional API key limited to the two search fields.
- Verify resolvers use `ctx.identity.sub` and never trust client-provided IDs.
- Confirm REST gateway/Lambda authorizer enforces Bearer tokens on protected routes.

API Summary
- Public (API Key):
  - `isEmailAvailable(email: String!): Boolean!`
  - `isNicknameAvailable(nickname: String!): Boolean!`
- Authenticated (Lambda/Cognito):
  - `createGoal(input: GoalInput!): Goal!` — must have `identity.sub`.  
  - `goals(userId: ID!): [Goal!]!` — only same `userId` as `identity.sub`.
  - `activeGoalsCount(userId: ID!): Int!` — only same `userId`, counts active.
  - `tasks(goalId: ID!): [Task!]!` — only tasks with `ownerId = identity.sub`.
