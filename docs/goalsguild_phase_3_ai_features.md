# Phase 3 – AI Features
_Generated: 2025-09-24_

## 33.1 – Integrate AI service for images (stub Ollama/OpenAI)
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 11.2

### Description
Objective: Execute the task **33.1 – Integrate AI service for images (stub Ollama/OpenAI)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 11.2

Detailed Steps:
1. Create or update FastAPI route(s) in the appropriate service package (e.g., /services/*-service). Use REST semantics or AppSync resolver where applicable.
2. Define strict Pydantic request/response models. Validate all inputs; return HTTP 4xx with error details on invalid payloads.
3. Implement business logic in a separate service module. Ensure idempotency and proper error handling (try/except; structured logs).
4. Persist or query data in DynamoDB single-table `gg_core` using PK/SK patterns defined in the project. Include createdAt/updatedAt timestamps.
5. Authorize requests using Cognito JWT middleware. Extract `sub` claim for the acting user; enforce RBAC where required.
6. Update OpenAPI schema or AppSync schema/resolver mapping as needed; document all fields and errors.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Define request/response DTOs
- [ ] Implement handler/service logic
- [ ] Add error handling and logging
- [ ] Write unit tests for handlers/services

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---

## 33.2 – Add endpoint for goal inspirational image
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 33.1

### Description
Objective: Execute the task **33.2 – Add endpoint for goal inspirational image** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 33.1

Detailed Steps:
1. Create or update FastAPI route(s) in the appropriate service package (e.g., /services/*-service). Use REST semantics or AppSync resolver where applicable.
2. Define strict Pydantic request/response models. Validate all inputs; return HTTP 4xx with error details on invalid payloads.
3. Implement business logic in a separate service module. Ensure idempotency and proper error handling (try/except; structured logs).
4. Persist or query data in DynamoDB single-table `gg_core` using PK/SK patterns defined in the project. Include createdAt/updatedAt timestamps.
5. Authorize requests using Cognito JWT middleware. Extract `sub` claim for the acting user; enforce RBAC where required.
6. Update OpenAPI schema or AppSync schema/resolver mapping as needed; document all fields and errors.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Define request/response DTOs
- [ ] Implement handler/service logic
- [ ] Add error handling and logging
- [ ] Write unit tests for handlers/services

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---

## 34.1 – Display AI images in goal detail frontend
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 33.2

### Description
Objective: Execute the task **34.1 – Display AI images in goal detail frontend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 33.2

Detailed Steps:
1. Create or update a React component/page under `src/pages` or `src/components` following design system and accessibility guidelines.
2. Connect to backend/API using the existing client utility. Handle loading, error, and empty states with clear UX.
3. Add form validation (zod or HTML5 constraints) and optimistic UI where safe. Ensure keyboard navigation and ARIA roles.
4. Write minimal CSS with Tailwind utility classes; ensure responsive behavior for mobile and desktop breakpoints.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Create component/page skeleton
- [ ] Wire API calls and state
- [ ] Add validation & accessibility
- [ ] Write unit tests for components

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---

## 35.1 – Implement AI suggestions service (text)
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 11.2

### Description
Objective: Execute the task **35.1 – Implement AI suggestions service (text)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 11.2

Detailed Steps:
1. Create or update FastAPI route(s) in the appropriate service package (e.g., /services/*-service). Use REST semantics or AppSync resolver where applicable.
2. Define strict Pydantic request/response models. Validate all inputs; return HTTP 4xx with error details on invalid payloads.
3. Implement business logic in a separate service module. Ensure idempotency and proper error handling (try/except; structured logs).
4. Persist or query data in DynamoDB single-table `gg_core` using PK/SK patterns defined in the project. Include createdAt/updatedAt timestamps.
5. Authorize requests using Cognito JWT middleware. Extract `sub` claim for the acting user; enforce RBAC where required.
6. Update OpenAPI schema or AppSync schema/resolver mapping as needed; document all fields and errors.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Define request/response DTOs
- [ ] Implement handler/service logic
- [ ] Add error handling and logging
- [ ] Write unit tests for handlers/services

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---

## 35.2 – Expose goal suggestion API
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 35.1

### Description
Objective: Execute the task **35.2 – Expose goal suggestion API** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 35.1

Detailed Steps:
1. Create or update FastAPI route(s) in the appropriate service package (e.g., /services/*-service). Use REST semantics or AppSync resolver where applicable.
2. Define strict Pydantic request/response models. Validate all inputs; return HTTP 4xx with error details on invalid payloads.
3. Implement business logic in a separate service module. Ensure idempotency and proper error handling (try/except; structured logs).
4. Persist or query data in DynamoDB single-table `gg_core` using PK/SK patterns defined in the project. Include createdAt/updatedAt timestamps.
5. Authorize requests using Cognito JWT middleware. Extract `sub` claim for the acting user; enforce RBAC where required.
6. Update OpenAPI schema or AppSync schema/resolver mapping as needed; document all fields and errors.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Define request/response DTOs
- [ ] Implement handler/service logic
- [ ] Add error handling and logging
- [ ] Write unit tests for handlers/services

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---

## 36.1 – Display AI suggestions in goal UI
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 35.2

### Description
Objective: Execute the task **36.1 – Display AI suggestions in goal UI** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 35.2

Detailed Steps:
1. Create or update a React component/page under `src/pages` or `src/components` following design system and accessibility guidelines.
2. Connect to backend/API using the existing client utility. Handle loading, error, and empty states with clear UX.
3. Add form validation (zod or HTML5 constraints) and optimistic UI where safe. Ensure keyboard navigation and ARIA roles.
4. Write minimal CSS with Tailwind utility classes; ensure responsive behavior for mobile and desktop breakpoints.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Create component/page skeleton
- [ ] Wire API calls and state
- [ ] Add validation & accessibility
- [ ] Write unit tests for components

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---

## 37.1 – Implement AI collaborator recommendation backend
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 19.4

### Description
Objective: Execute the task **37.1 – Implement AI collaborator recommendation backend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 19.4

Detailed Steps:
1. Create or update FastAPI route(s) in the appropriate service package (e.g., /services/*-service). Use REST semantics or AppSync resolver where applicable.
2. Define strict Pydantic request/response models. Validate all inputs; return HTTP 4xx with error details on invalid payloads.
3. Implement business logic in a separate service module. Ensure idempotency and proper error handling (try/except; structured logs).
4. Persist or query data in DynamoDB single-table `gg_core` using PK/SK patterns defined in the project. Include createdAt/updatedAt timestamps.
5. Authorize requests using Cognito JWT middleware. Extract `sub` claim for the acting user; enforce RBAC where required.
6. Update OpenAPI schema or AppSync schema/resolver mapping as needed; document all fields and errors.
7. Create or update a React component/page under `src/pages` or `src/components` following design system and accessibility guidelines.
8. Connect to backend/API using the existing client utility. Handle loading, error, and empty states with clear UX.
9. Add form validation (zod or HTML5 constraints) and optimistic UI where safe. Ensure keyboard navigation and ARIA roles.
10. Write minimal CSS with Tailwind utility classes; ensure responsive behavior for mobile and desktop breakpoints.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Implement core logic
- [ ] Add defensive error handling
- [ ] Write unit tests
- [ ] Document behavior and config

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---

## 37.2 – Expose collaborator recommendation API
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 37.1

### Description
Objective: Execute the task **37.2 – Expose collaborator recommendation API** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 37.1

Detailed Steps:
1. Create or update FastAPI route(s) in the appropriate service package (e.g., /services/*-service). Use REST semantics or AppSync resolver where applicable.
2. Define strict Pydantic request/response models. Validate all inputs; return HTTP 4xx with error details on invalid payloads.
3. Implement business logic in a separate service module. Ensure idempotency and proper error handling (try/except; structured logs).
4. Persist or query data in DynamoDB single-table `gg_core` using PK/SK patterns defined in the project. Include createdAt/updatedAt timestamps.
5. Authorize requests using Cognito JWT middleware. Extract `sub` claim for the acting user; enforce RBAC where required.
6. Update OpenAPI schema or AppSync schema/resolver mapping as needed; document all fields and errors.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Define request/response DTOs
- [ ] Implement handler/service logic
- [ ] Add error handling and logging
- [ ] Write unit tests for handlers/services

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---

## 38.1 – Show collaborator suggestions in frontend UI
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 37.2

### Description
Objective: Execute the task **38.1 – Show collaborator suggestions in frontend UI** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 37.2

Detailed Steps:
1. Create or update a React component/page under `src/pages` or `src/components` following design system and accessibility guidelines.
2. Connect to backend/API using the existing client utility. Handle loading, error, and empty states with clear UX.
3. Add form validation (zod or HTML5 constraints) and optimistic UI where safe. Ensure keyboard navigation and ARIA roles.
4. Write minimal CSS with Tailwind utility classes; ensure responsive behavior for mobile and desktop breakpoints.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Create component/page skeleton
- [ ] Wire API calls and state
- [ ] Add validation & accessibility
- [ ] Write unit tests for components

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---

## 39.1 – Implement AI progress analysis service
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 17.3

### Description
Objective: Execute the task **39.1 – Implement AI progress analysis service** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 17.3

Detailed Steps:
1. Create or update FastAPI route(s) in the appropriate service package (e.g., /services/*-service). Use REST semantics or AppSync resolver where applicable.
2. Define strict Pydantic request/response models. Validate all inputs; return HTTP 4xx with error details on invalid payloads.
3. Implement business logic in a separate service module. Ensure idempotency and proper error handling (try/except; structured logs).
4. Persist or query data in DynamoDB single-table `gg_core` using PK/SK patterns defined in the project. Include createdAt/updatedAt timestamps.
5. Authorize requests using Cognito JWT middleware. Extract `sub` claim for the acting user; enforce RBAC where required.
6. Update OpenAPI schema or AppSync schema/resolver mapping as needed; document all fields and errors.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Define request/response DTOs
- [ ] Implement handler/service logic
- [ ] Add error handling and logging
- [ ] Write unit tests for handlers/services

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---

## 39.2 – Expose progress analysis API
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 39.1

### Description
Objective: Execute the task **39.2 – Expose progress analysis API** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 39.1

Detailed Steps:
1. Create or update FastAPI route(s) in the appropriate service package (e.g., /services/*-service). Use REST semantics or AppSync resolver where applicable.
2. Define strict Pydantic request/response models. Validate all inputs; return HTTP 4xx with error details on invalid payloads.
3. Implement business logic in a separate service module. Ensure idempotency and proper error handling (try/except; structured logs).
4. Persist or query data in DynamoDB single-table `gg_core` using PK/SK patterns defined in the project. Include createdAt/updatedAt timestamps.
5. Authorize requests using Cognito JWT middleware. Extract `sub` claim for the acting user; enforce RBAC where required.
6. Update OpenAPI schema or AppSync schema/resolver mapping as needed; document all fields and errors.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Define request/response DTOs
- [ ] Implement handler/service logic
- [ ] Add error handling and logging
- [ ] Write unit tests for handlers/services

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---

## 40.1 – Display AI insights dashboard frontend
**Labels:** `AI Features` (pink), `Phase 3 – AI Features` (pink)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 39.2

### Description
Objective: Execute the task **40.1 – Display AI insights dashboard frontend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 3 – AI Features
Category: AI Features
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 39.2

Detailed Steps:
1. Create or update a React component/page under `src/pages` or `src/components` following design system and accessibility guidelines.
2. Connect to backend/API using the existing client utility. Handle loading, error, and empty states with clear UX.
3. Add form validation (zod or HTML5 constraints) and optimistic UI where safe. Ensure keyboard navigation and ARIA roles.
4. Write minimal CSS with Tailwind utility classes; ensure responsive behavior for mobile and desktop breakpoints.

Acceptance Criteria (task succeeds only if ALL criteria are met):
- Unit tests created or updated for all new code paths; tests pass locally and in CI.
- Integration tests validate end-to-end behavior against a dev stack (mocked if necessary for external services).
- UAT checklist verified: user can execute the intended flow without errors; UI states and API responses match specification.
- Static analysis (type checks, lint) passes; security scans reveal no critical/high issues.
- Performance sanity check completed (basic latency/throughput or bundle size check).
- Documentation updated (README/OpenAPI/AppSync schema notes).

Notes:
- Follow project conventions for logging (structured JSON) and error handling.
- All secrets/keys must be read from SSM/KMS or environment variables; never hardcode.
- Ensure idempotent and retry-safe operations for external calls.

### Checklist — Work Items
- [ ] Create component/page skeleton
- [ ] Wire API calls and state
- [ ] Add validation & accessibility
- [ ] Write unit tests for components

### Checklist — Quality & Delivery
- [ ] Unit tests written & passing (task only succeeds if tests pass)
- [ ] Integration tests passing (cover core flow)
- [ ] UAT scenario verified by steps in description
- [ ] Static analysis & code style checks passed
- [ ] Security checks (deps, secrets, RBAC) passed
- [ ] Performance sanity check completed
- [ ] Documentation updated (README/API)
- [ ] IaC updated & applied to dev — N/A if not infra
- [ ] Deployed to dev via CI/CD
- [ ] Smoke tests passed in dev
- [ ] Promote to staging (if applicable)

---
