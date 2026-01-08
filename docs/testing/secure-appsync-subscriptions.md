# Secure AppSync Subscriptions (Single GraphQL API) – Implementation Guide

## Goal
Keep a **single AppSync GraphQL API** using the existing Lambda authorizer for queries/mutations, while securing WebSocket subscriptions so they only succeed when the user presents a valid JWT. We will still use an AppSync API key for the initial subscription handshake, but all subscription resolvers will enforce JWT validation before returning any data.

This guide follows the repository’s established backend (Python/FastAPI/Lambda) and frontend (React + Vite + SWC) patterns and is written for a junior developer.

---

## Prerequisites

- AWS access to the AppSync API, Lambda authorizer secrets, and DynamoDB tables.
- Local environment set up per the project README (`poetry`/`pip` for backend, `pnpm`/`npm` for frontend, etc.).
- Familiarity with:
  - AppSync resolver mapping templates or pipeline resolvers.
  - Existing JWT verification utilities (`backend/services/authorizer-service/security.py`, etc.).
  - Frontend GraphQL utilities located under `frontend/src/lib`.

---

## Backend Work

### 1. Inventory Current Subscriptions

1. Inspect `*.graphql` schema files under `backend/infra/terraform2/graphql` to list all subscription fields (e.g., `onMessage`, `onQuestUpdate`).
2. For each subscription, note the resolver file (VTL or pipeline) defined in Terraform (see `backend/infra/terraform2/resolvers` and `stacks/appsync`).
3. Document which DynamoDB tables or Lambdas they currently hit (helpful for unit tests later).

> _Tip_: add your findings to `docs/secure-appsync-subscriptions.md` under a “Subscriptions audited” heading during implementation so reviewers can see coverage.

### 2. Create a Shared Subscription Auth Lambda (if none exists)

We already have JWT verification logic in `backend/services/authorizer-service/security.py`. Reuse that to avoid divergence:

1. Add a new Lambda in `backend/services/authorizer-service` (e.g., `subscription_auth.py`) that:
   - Extracts the JWT from headers (`authorization`).
   - Verifies the signature/claims using existing helpers.
   - Checks any business rules (room membership, guild privileges).
   - Returns user context (e.g., `{ "sub": "...", "nickname": "...", "allowedRooms": [...] }`) or raises an error.
2. Wire a simple unit test with **pytest** under `backend/services/authorizer-service/tests/test_subscription_auth.py` that covers:
   - Valid token returns expected context.
   - Missing/expired/invalid token raises `Unauthorized`.
   - Authorized user denied for a room they do not belong to.
3. Package the Lambda via the existing build script (`package.sh`). Update Terraform or SAM templates to deploy it (see `backend/infra/terraform2/stacks/authorizer`).

> _Pattern to follow_: existing Lambda modules (e.g., `authorizer.py`) use structured logging via `logging` and helper functions—mirror that style to keep code consistent.

### 3. Update Subscription Resolvers

For each subscription field:

1. Convert the resolver to a **pipeline** resolver if it isn’t one already:
   - **Step 1 (Invoke auth Lambda)**: call the new `subscription_auth` Lambda. Use response mapping to fail fast on unauthorized attempts (`$util.error("Unauthorized")`).
   - **Step 2 (Existing data source logic)**: forward authorized requests to DynamoDB/Lambda exactly as today. Inject any needed context from the auth Lambda (e.g., user id).
2. Update VTL templates under `backend/infra/terraform2/resolvers` accordingly. Follow the repo’s naming convention (`*.req.vtl`, `*.res.vtl`).
3. Write or update unit tests for the resolvers using the existing Jest-style mapping template tests (see `backend/infra/terraform2/resolvers/__tests__`). Include:
   - Valid auth output → resolver proceeds.
   - Auth failure → resolver returns 401-style error.
4. Update Terraform to include the new pipeline resolver stages (modify `backend/infra/terraform2/stacks/appsync/main.tf` or relevant module).

### 4. Secure API Key Distribution (Security Speed Bumps)

1. **Authenticated distribution endpoint**
   - Add `GET /appsync/subscription-key` to the user-service (or messaging-service if more appropriate).
   - Reuse the existing FastAPI patterns in `backend/services/user-service/app/main.py`.
   - Contract:
     ```json
     {
       "apiKey": "string",
       "issuedAt": "ISO8601 timestamp",
       "expiresAt": "ISO8601 timestamp"
     }
     ```
     If you choose to encrypt the key, return `{ "ciphertext": "...", "nonce": "...", "issuedAt": "...", "expiresAt": "..." }`.
   - Implementation details:
     - Fetch the key from SSM (`/goalsguild/appsync/subscription_key`) or Secrets Manager.
      - Store only the SSM parameter path (`APPSYNC_SUBSCRIPTION_KEY_PARAM`) inside the service env vars so key rotation does not require redeploying the container.
      - Mask the key in logs via `_safe_event`.
     - Return 401 for invalid/blocked users.
   - Unit tests: `backend/services/user-service/tests/test_subscription_key.py` should cover success, unauthorized, expired, and SSM failure cases.

2. **Automated rotation**
   - Create a scheduled Lambda (new folder under `backend/services/automation-service/rotate_appsync_key.py` or similar) that:
     1. Calls `aws appsync create-api-key`.
     2. Stores the new key + expiry in SSM.
     3. Publishes an SNS/CloudWatch event to notify services (optional but recommended).
   - Add pytest tests that mock AppSync + SSM clients.
   - Update Terraform (`backend/infra/terraform2/stacks/appsync/main.tf` and `stacks/security` if needed) to provision the schedule and IAM permissions.

3. **Optional encryption/obfuscation**
   - If required, encrypt the key before returning it:
     - Add helper functions (e.g., `backend/services/common/security/crypto.py`) for AES-GCM.
     - Derive a per-session key from the user's JWT (e.g., HKDF over sub + session id).
   - Document the encryption scheme in the API contract section below.

### 5. Harden API Key Management

1. Ensure the AppSync API key is used only during the WebSocket handshake:
   - In Terraform (`backend/infra/terraform2/stacks/appsync/main.tf`), add a comment noting it's "handshake only".
2. Configure a short TTL (e.g., 7 days or less) when creating the key or via the rotation Lambda.
3. Document manual rotation steps in deployment scripts (`backend/infra/terraform2/scripts/deploy-apigateway.ps1`) so on-call engineers can rotate if automation fails.
4. Update CI/CD to invalidate cached keys after each deployment (e.g., send cache-busting events to services that store keys in memory).

### 6. Monitoring & Alerting

1. Add CloudWatch metric filters for `Unauthorized` logs emitted by the subscription auth Lambda.
2. Automate CloudWatch alarms (Terraform module or CDK stack) for:
   - Unauthorized subscription attempts (threshold-based). We now alert on `AWS/AppSync 4XXError` per API.
   - Rotation Lambda failures (e.g., `Errors > 0`).
   - Key retrieval endpoint spikes (unexpected 200s or 401s).
   - **Cost guardrail**: CloudWatch billing alarm for `AWS/Billing EstimatedCharges` scoped to AppSync signals when projected monthly cost crosses the configured threshold (today defaulting to $150). When triggered, notify the team to evaluate pattern changes.
   - Script these alarms so they are recreated on every deploy (`backend/infra/terraform2/stacks/monitoring`).
3. Update runbooks or `docs/operations.md` describing how to respond to unauthorized bursts, failed key rotations, or cost alarms (include decision tree for switching to Event API/custom WebSockets).

### 7. Integration Tests (Backend)

Follow backend patterns for integration testing (e.g., `pytest` with moto or localstack):

1. Create integration tests under `backend/services/messaging-service/tests` (or appropriate service):
   - Simulate a valid WebSocket subscribe by invoking the pipeline manually (AppSync testing SDK or using `requests` to the real endpoint with both headers).
   - Assert unauthorized requests are rejected.
2. Update CI configuration if needed to run the new tests (check `scripts/test-all.ps1` or GitHub Actions).

### 8. Public Availability Queries (`isEmailAvailable`, `isNicknameAvailable`)

These queries must remain callable before authentication. Secure them while allowing API-key access:

1. Ensure the resolvers for `isEmailAvailable` and `isNicknameAvailable` (check `backend/infra/terraform2/graphql/schema.graphql`) explicitly allow the `API_KEY` auth mode in the AppSync resolver config but **limit the data returned** to a boolean.
2. Add lightweight rate limiting in the resolver or via Velocity template:
   - Example: reject if the same email/nickname is queried more than N times per minute from a single IP (store counts in DynamoDB or leverage WAF rate-based rules).
3. Unit tests (`backend/services/user-service/tests/test_public_availability.py`) should cover:
   - API key request returns correct boolean.
   - Requests with JWT still work (backward compatibility).
   - Resolver never returns sensitive fields.
4. Update backend documentation/comments noting these queries are intentionally public but safe because they expose only availability and are rate-limited.

---

## Frontend Work

### 1. Subscription Client Updates

1. Fetch the subscription key on demand:
   - Add `getSubscriptionKey()` to `frontend/src/lib/api.ts` that calls `GET /appsync/subscription-key`.
   - Store the key only in memory (`useState`/`useRef`). Do **not** persist to `localStorage` or cookies.
2. Update `frontend/src/lib/utils.ts` to:
   - Retrieve the key before connecting.
   - Inject both `x-api-key` and `Authorization` headers.
   - Refresh the key when `expiresAt` is near (e.g., 60 seconds before).
3. Enhance `useProductionMessaging.ts` (and similar hooks) to:
   - Handle `Unauthorized` or `Connection failed` responses by re-fetching the key and retrying once.
   - Surface a user-friendly toast if it still fails.
4. Optional encrypted key flow:
   - If the backend returns `{ ciphertext, nonce }`, decrypt client-side using a helper (create `frontend/src/lib/crypto.ts` following existing utils style).
   - Add typings under `frontend/src/types/appsync.ts` for both plaintext and encrypted responses.
5. Follow existing logging/error conventions (`logger.warn`, `logger.error`) and use global events (e.g., `window.dispatchEvent(new CustomEvent('subscription:auth-error'))`) so other features can react.
6. Remember that pre-login flows (e.g., `isEmailAvailable`, `isNicknameAvailable`) **must** call AppSync with the API key only (no JWT available yet). Implement this via the shared `graphqlWithApiKey` helper and keep the logic isolated so it cannot access protected data.
7. We issue a dedicated API key just for availability checks:
   - Terraform provisions two AppSync API keys (subscription + availability) and stores them in SSM under `/goalsguild/${var.environment}/appsync/*`. The user-service env vars now reference the parameter paths (e.g. `APPSYNC_AVAILABILITY_KEY_PARAM`), so rotation only updates the SSM values.
   - `/appsync/availability-key` returns the unauthenticated key (rate limited) while `/appsync/subscription-key` remains JWT-protected.
   - Pipeline resolvers for `isEmailAvailable` and `isNicknameAvailable` now invoke the shared `subscription_auth` Lambda in `availability` mode, which validates the presented `x-api-key` against the SSM secret before running the DynamoDB query.
   - We still rate-limit the REST endpoint and added CloudWatch alarms for request spikes.

### API Contract (Frontend ↔ Backend)

| Endpoint | Method | Headers | Response | Notes |
| --- | --- | --- | --- | --- |
| `/appsync/subscription-key` | `GET` | `Authorization: Bearer <JWT>` | `{ "apiKey": "string", "issuedAt": "ISO8601", "expiresAt": "ISO8601" }` | Returns 401 if JWT invalid/expired. |
| `/appsync/subscription-key` (encrypted variant) | `GET` | `Authorization: Bearer <JWT>` | `{ "ciphertext": "base64", "nonce": "base64", "issuedAt": "...", "expiresAt": "..." }` | Client must decrypt using per-session key. |
| `/appsync/availability-key` (optional) | `GET` | _No auth_ or lightweight captcha if desired | `{ "apiKey": "string", "expiresAt": "ISO8601" }` | Only if you separate the availability key from the subscription key. |
| WebSocket handshake | N/A | `x-api-key: <value>`, `Authorization: Bearer <JWT>` | N/A | Managed by AppSync; resolver enforces auth. |

TypeScript interfaces (create `frontend/src/types/appsync.ts` if not present):
```ts
export interface SubscriptionKeyResponse {
  apiKey: string;
  issuedAt: string;
  expiresAt: string;
}

export interface SubscriptionKeyCipherResponse {
  ciphertext: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
}

export interface AvailabilityKeyResponse {
  apiKey: string;
  expiresAt: string;
}
```

### 2. Frontend Tests

1. Add **Vitest** unit tests under `frontend/src/lib/__tests__/api.test.ts` (or create `subscriptionClient.test.ts`) that verify:
   - `getSubscriptionKey` attaches the JWT and parses the response.
   - Handshake headers include both API key + JWT.
   - Unauthorized/expired responses trigger the retry/error flow.
   - (If encrypted) the decrypt helper returns the expected plaintext.
2. Consider a Cypress or Playwright e2e test (if the suite exists) that opens the chat page and asserts messages stream correctly for authorized users.

---

## Rollout

1. **Dev environment**: deploy updated Terraform + Lambdas; test manually with Postman or `graphql-ws`.
2. **Staging**: run CI tests, share the staged API key with QA, confirm unauthorized listeners are blocked.
3. **Prod**: rotate the production API key as part of deployment, deploy resolver and Lambda changes, monitor CloudWatch alarms for the first 24 hours.
4. Update docs and notify the team about the new key rotation schedule and the security improvement.

---

## Definition of Done (Checklist)

- [ ] All subscription resolvers call the shared auth Lambda/Pipeline stage.
- [ ] New `subscription_auth` Lambda deployed and covered by pytest unit tests.
- [ ] REST endpoint `GET /appsync/subscription-key` implemented with unit/integration tests.
- [ ] Automated API key rotation Lambda/script deployed with monitoring.
- [ ] Resolver mapping template unit tests updated/added for auth success & failure.
- [ ] AppSync API key rotation policy documented and automated (script or runbook).
- [ ] Frontend subscription client fetches/decrypts key as needed, sends both headers, and has Vitest coverage.
- [ ] Integration/e2e tests (backend and frontend) confirm authorized flow works and unauthorized flow is blocked.
- [ ] CloudWatch alarms/metrics for unauthorized subscription attempts and rotation failures configured.
- [ ] `isEmailAvailable`/`isNicknameAvailable` resolvers allow API key usage, limit responses to booleans, and are rate-limited; corresponding backend/frontend tests cover both API key and JWT flows.
- [ ] Documentation updated: this guide and any ops runbooks.
