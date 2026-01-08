Title: Persisting User Profiles to gg_core via AppSync Pipeline

Objectives
- Persist user profiles into `gg_core` after signup.
- Align client password validation with backend rules.
- Ensure end-to-end data consistency and security.

Architecture
- AppSync Mutation: `createUser` (Pipeline)
  - Function 1: `createUserSignup` (Lambda DS → `goalsguild_appsync_create_user`)
    - Validates input & password strength
    - Calls API Gateway `POST /users/signup` (user-service)
  - Function 2: `persistUserProfile` (Lambda DS → `goalsguild_appsync_persist_user`)
    - Writes user profile + email lock to `gg_core`
  - Resolver after: Shapes GraphQL User output (id, email, nickname, etc.)

Data flow
1) Client calls GraphQL `createUser` with user input.
2) AppSync Function 1 invokes the signup Lambda which forwards to user-service for secure hashing + email confirmation.
3) AppSync Function 2 persists the profile to DynamoDB (`gg_core`) in a transaction (email uniqueness + profile).
4) Resolver returns the normalized User payload to the client.

Security
- Passwords: Strong validation at client, at Function 1, and definitive hashing in user-service (bcrypt via passlib).
- Least privilege: AppSync can only invoke the two Lambdas; Lambdas use a role with DDB write scoped to `gg_core`.
- No plaintext passwords stored in `gg_core`.

Implementation Highlights
- Terraform module updates add Lambda data sources, AppSync Functions, and a pipeline resolver.
- New Lambdas:
  - `goalsguild_appsync_create_user` (existing from prior refactor)
  - `goalsguild_appsync_persist_user` (new) writes to DDB using `transactWrite`.
- Frontend password validation enhanced to match backend rules (min 8; lower, upper, digit, special).

Deploy
- From `backend/infra/terraform`:
  - `terraform init`
  - `terraform apply`

Configuration
- `USER_SERVICE_BASE_URL` for `goalsguild_appsync_create_user` is derived from API Gateway stage output.
- `TABLE` for `goalsguild_appsync_persist_user` is set to `gg_core` table name.

Testing
- Backend unit tests under `backend/infra/terraform`:
  - Resolver tests cover Invoke and response shape.
  - Lambda tests cover validation and DDB transaction composition.
  - Run: `npm install && npm test`.

Maintainability
- Clear separation of responsibilities:
  - user-service: authentication, hashing, email confirmations
  - pipeline function 2: persistence to `gg_core`
  - AppSync: orchestration and consistent API response

