# Phase 2 – Gamification
_Generated: 2025-09-24_

## 23.1 – Define XP schema in DynamoDB
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 15.5

### Description
Objective: Execute the task **23.1 – Define XP schema in DynamoDB** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Infrastructure (Terraform/CloudFormation, AWS)
Dependencies: 15.5

Detailed Steps:
1. Update Terraform/CloudFormation templates under `infra/terraform` to provision or modify required AWS resources.
2. Run plan/apply in a sandbox environment. Capture outputs (ARNs, endpoints) and propagate configuration via SSM/ENV.
3. Set up or update CloudWatch alarms/metrics/log groups for the component. Add basic dashboards if applicable.
4. Document rollback steps and resource ownership tags.

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
- [ ] Define key schema and secondary indexes
- [ ] Create/Update IaC for table/indexes
- [ ] Implement repository/data-access helpers
- [ ] Write unit tests for data layer

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

## 23.2 – Implement XP calculation service
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 23.1

### Description
Objective: Execute the task **23.2 – Implement XP calculation service** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 23.1

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

## 23.3 – Expose XP API endpoint
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 23.2

### Description
Objective: Execute the task **23.3 – Expose XP API endpoint** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 23.2

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

## 24.1 – Add XP display in user profile frontend
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 23.3

### Description
Objective: Execute the task **24.1 – Add XP display in user profile frontend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 23.3

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

## 25.1 – Define level thresholds in backend
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 23.3

### Description
Objective: Execute the task **25.1 – Define level thresholds in backend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 23.3

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

## 25.2 – Implement level progression logic
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 25.1

### Description
Objective: Execute the task **25.2 – Implement level progression logic** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 25.1

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

## 25.3 – Expose level info in API
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 25.2

### Description
Objective: Execute the task **25.3 – Expose level info in API** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 25.2

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

## 26.1 – Display user level in frontend profile
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 25.3

### Description
Objective: Execute the task **26.1 – Display user level in frontend profile** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 25.3

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

## 26.2 – Add level progress bar component
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 26.1

### Description
Objective: Execute the task **26.2 – Add level progress bar component** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 26.1

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

## 27.1 – Define badge schema in DynamoDB
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 25.3

### Description
Objective: Execute the task **27.1 – Define badge schema in DynamoDB** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Infrastructure (Terraform/CloudFormation, AWS)
Dependencies: 25.3

Detailed Steps:
1. Update Terraform/CloudFormation templates under `infra/terraform` to provision or modify required AWS resources.
2. Run plan/apply in a sandbox environment. Capture outputs (ARNs, endpoints) and propagate configuration via SSM/ENV.
3. Set up or update CloudWatch alarms/metrics/log groups for the component. Add basic dashboards if applicable.
4. Document rollback steps and resource ownership tags.

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
- [ ] Define key schema and secondary indexes
- [ ] Create/Update IaC for table/indexes
- [ ] Implement repository/data-access helpers
- [ ] Write unit tests for data layer

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

## 27.2 – Implement badge assignment logic
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 27.1

### Description
Objective: Execute the task **27.2 – Implement badge assignment logic** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 27.1

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

## 27.3 – Expose badge API endpoint
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 27.2

### Description
Objective: Execute the task **27.3 – Expose badge API endpoint** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 27.2

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

## 28.1 – Display badges on user profile UI
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 27.3

### Description
Objective: Execute the task **28.1 – Display badges on user profile UI** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 27.3

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

## 29.1 – Define challenge schema in DynamoDB
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 25.3

### Description
Objective: Execute the task **29.1 – Define challenge schema in DynamoDB** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Infrastructure (Terraform/CloudFormation, AWS)
Dependencies: 25.3

Detailed Steps:
1. Update Terraform/CloudFormation templates under `infra/terraform` to provision or modify required AWS resources.
2. Run plan/apply in a sandbox environment. Capture outputs (ARNs, endpoints) and propagate configuration via SSM/ENV.
3. Set up or update CloudWatch alarms/metrics/log groups for the component. Add basic dashboards if applicable.
4. Document rollback steps and resource ownership tags.

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
- [ ] Define key schema and secondary indexes
- [ ] Create/Update IaC for table/indexes
- [ ] Implement repository/data-access helpers
- [ ] Write unit tests for data layer

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

## 29.2 – Implement challenge creation API
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 29.1

### Description
Objective: Execute the task **29.2 – Implement challenge creation API** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 29.1

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

## 29.3 – Implement join challenge API
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 29.2

### Description
Objective: Execute the task **29.3 – Implement join challenge API** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 29.2

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

## 29.4 – Track challenge progress backend
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 29.2

### Description
Objective: Execute the task **29.4 – Track challenge progress backend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 29.2

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

## 30.1 – Build challenge list page frontend
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 29.2

### Description
Objective: Execute the task **30.1 – Build challenge list page frontend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 29.2

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

## 30.2 – Build challenge detail page frontend
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 29.4

### Description
Objective: Execute the task **30.2 – Build challenge detail page frontend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 29.4

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

## 31.1 – Implement leaderboard query backend
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 23.3

### Description
Objective: Execute the task **31.1 – Implement leaderboard query backend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 23.3

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

## 31.2 – Expose leaderboard API
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 31.1

### Description
Objective: Execute the task **31.2 – Expose leaderboard API** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 31.1

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

## 32.1 – Create leaderboard UI component
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 31.2

### Description
Objective: Execute the task **32.1 – Create leaderboard UI component** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 31.2

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

## 32.2 – Add filters/sorting in leaderboard UI
**Labels:** `Gamification` (purple), `Phase 2 – Gamification` (lime)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 32.1

### Description
Objective: Execute the task **32.2 – Add filters/sorting in leaderboard UI** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 2 – Gamification
Category: Gamification
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 32.1

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
