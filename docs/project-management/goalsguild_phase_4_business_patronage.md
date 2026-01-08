# Phase 4 – Business & Patronage
_Generated: 2025-09-24_

## 41.1 – Define partner schema in DynamoDB
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 4.1

### Description
Objective: Execute the task **41.1 – Define partner schema in DynamoDB** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Infrastructure (Terraform/CloudFormation, AWS)
Dependencies: 4.1

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

## 41.2 – Implement partner portal backend (CRUD)
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 41.1

### Description
Objective: Execute the task **41.2 – Implement partner portal backend (CRUD)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 41.1

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

## 41.3 – Expose partner API
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 41.2

### Description
Objective: Execute the task **41.3 – Expose partner API** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 41.2

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

## 42.1 – Build partner dashboard frontend
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 41.3

### Description
Objective: Execute the task **42.1 – Build partner dashboard frontend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 41.3

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

## 43.1 – Implement patron schema in DynamoDB
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 4.1

### Description
Objective: Execute the task **43.1 – Implement patron schema in DynamoDB** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Infrastructure (Terraform/CloudFormation, AWS)
Dependencies: 4.1

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

## 43.2 – Implement patronage tiers logic
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 43.1

### Description
Objective: Execute the task **43.2 – Implement patronage tiers logic** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 43.1

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

## 43.3 – Integrate payment stub (Stripe/PayPal sandbox)
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 43.2

### Description
Objective: Execute the task **43.3 – Integrate payment stub (Stripe/PayPal sandbox)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 43.2

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

## 44.1 – Build patron subscription page frontend
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 43.3

### Description
Objective: Execute the task **44.1 – Build patron subscription page frontend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 43.3

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

## 44.2 – Display patron benefits in profile UI
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 43.3

### Description
Objective: Execute the task **44.2 – Display patron benefits in profile UI** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 43.3

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

## 45.1 – Implement analytics backend service (metrics collection)
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 41.2

### Description
Objective: Execute the task **45.1 – Implement analytics backend service (metrics collection)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 41.2

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

## 45.2 – Expose analytics API endpoints
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 45.1

### Description
Objective: Execute the task **45.2 – Expose analytics API endpoints** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 45.1

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

## 46.1 – Build analytics dashboard frontend
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 45.2

### Description
Objective: Execute the task **46.1 – Build analytics dashboard frontend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 45.2

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

## 46.2 – Add charts/graphs for partner ROI
**Labels:** `Business & Patronage` (lime), `Phase 4 – Business & Patronage` (purple)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 45.2

### Description
Objective: Execute the task **46.2 – Add charts/graphs for partner ROI** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 4 – Business & Patronage
Category: Business & Patronage
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 45.2

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
