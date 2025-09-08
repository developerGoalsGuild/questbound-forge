Title: AppSync createUser → Lambda (user-service) Refactor

Overview
- Replaced the AppSync Unit resolver (DynamoDB) for `Mutation.createUser` with a Lambda data source.
- Added a lightweight Lambda (`goalsguild_appsync_create_user`) that forwards to the existing API Gateway-backed `user-service` (`POST /users/signup`).
- Mirrored password strength validation and ensured no plaintext password is persisted in GraphQL’s DDB table.
- Updated tests to cover the Lambda and the resolver request/response mapping.

Architecture
- AppSync API (GraphQL)
  - Data Sources:
    - DDB (unchanged for other fields)
    - NONE (subscriptions)
    - LAMBDA_USER (new): invokes `goalsguild_appsync_create_user` Lambda
- Lambda: `goalsguild_appsync_create_user`
  - Runtime: Node.js 20
  - Env: `USER_SERVICE_BASE_URL` → API Gateway base URL (e.g., https://{restApiId}.execute-api.{region}.amazonaws.com/{stage})
  - Function: Validates input, enforces password strength, calls `POST /users/signup` on `user-service` gateway.
- API Gateway REST API
  - `POST /users/signup` → `goalsguild_user_service` (FastAPI via Lambda Web Adapter)
  - Existing endpoints unchanged.

Changes
- Terraform
  - Module `modules/appsync_api`:
    - Added optional Lambda data source and IAM role for invocation.
    - New variable `lambda_user_function_arn`.
    - Resolver mapping now supports `data_source = "LAMBDA_USER"`.
  - Module `modules/network`:
    - New output `api_invoke_url` for the API Gateway stage invoke URL.
  - Root `main.tf`:
    - New Lambda ZIP module `lambda_appsync_create_user` (Node 20) with env var `USER_SERVICE_BASE_URL = module.network.api_invoke_url`.
    - Pass its ARN to `module.appsync.lambda_user_function_arn`.
    - Switched `Mutation.createUser` resolver data source to `LAMBDA_USER`.
- Resolver
  - `backend/infra/terraform/resolvers/createUser.js` now returns `{ operation: 'Invoke', payload }` for Lambda, preserving validation and response shape.
- Lambda code
  - `backend/infra/terraform/lambdas/appsync_create_user/index.mjs` implements handler with input validation and secure forwarding to API Gateway.
- Tests
  - Resolver tests updated to expect `Invoke`.
  - New Lambda tests under `lambdas/appsync_create_user/__tests__`.
  - Jest config updated to include `lambdas` in roots.

Security Considerations
- Password strength mirrored from backend (min length 8; lower, upper, digit, special required).
- No plaintext password is written to the GraphQL single-table store.
- AppSync is granted least-privileged `lambda:InvokeFunction` on the specific Lambda.
- API Gateway continues to handle hashing and email confirmation via `user-service` (FastAPI) which stores salted bcrypt hashes.
- Input validation (email, fullName, country allow-list, bio length) remains enforced in the resolver before invoking Lambda.

Integration Steps
1) Terraform
   - From `backend/infra/terraform`: `terraform init && terraform apply`.
   - Ensure `var.api_stage_name` and region are correct; this computes `USER_SERVICE_BASE_URL`.
2) AppSync
   - After apply, `Mutation.createUser` points to Lambda; no schema changes.
3) Frontend
   - No code changes required. It continues to call the `createUser` mutation.

Testing
- Infra tests are not included here; unit tests cover mapping logic.
- Run: `cd backend/infra/terraform && npm install && npm test`.
- Resolver tests: ensure request maps to Lambda invoke; response shape is consistent.
- Lambda tests: Ensure field validation, password strength checks, and HTTP success/error handling.

Performance
- The resolver now invokes a single Lambda (Node) which performs one HTTP call to `user-service`. This adds minor latency versus direct DDB but centralizes hashing, email confirmation, and auth flows in one place.

Backwards Compatibility
- GraphQL mutation response fields unchanged; frontend continues to work.
- Under the hood, user identity data is managed by `user-service` rather than being duplicated in `gg_core`.

