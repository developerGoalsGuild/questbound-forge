khlhj# Phase 1 – Foundation
_Generated: 2025-09-24_

## 1.1 – Create GitHub repo and branch structure
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)

### Description
Objective: Execute the task **1.1 – Create GitHub repo and branch structure** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: None

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

## 1.2 – Configure GitHub Actions workflow skeleton
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 1.1

### Description
Objective: Execute the task **1.2 – Configure GitHub Actions workflow skeleton** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 1.1

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

## 1.3 – Add issue templates and PR templates
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 1.1

### Description
Objective: Execute the task **1.3 – Add issue templates and PR templates** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 1.1

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

## 2.1 – Initialize React 18 + TypeScript project with Vite
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 1.1

### Description
Objective: Execute the task **2.1 – Initialize React 18 + TypeScript project with Vite** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 1.1

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

## 2.2 – Install Tailwind CSS and basic config
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 2.1

### Description
Objective: Execute the task **2.2 – Install Tailwind CSS and basic config** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 2.1

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

## 2.3 – Setup Redux Toolkit and base slice
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 2.1

### Description
Objective: Execute the task **2.3 – Setup Redux Toolkit and base slice** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 2.1

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

## 2.4 – Setup React Router with placeholder routes
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 2.1

### Description
Objective: Execute the task **2.4 – Setup React Router with placeholder routes** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 2.1

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

## 3.1 – Scaffold FastAPI project structure
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 1.1

### Description
Objective: Execute the task **3.1 – Scaffold FastAPI project structure** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 1.1

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

## 3.2 – Add first healthcheck endpoint (/ping)
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 3.1

### Description
Objective: Execute the task **3.2 – Add first healthcheck endpoint (/ping)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 3.1

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

## 3.3 – Setup poetry/requirements.txt and linting
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 3.1

### Description
Objective: Execute the task **3.3 – Setup poetry/requirements.txt and linting** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 3.1

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

## 4.1 – Create DynamoDB table (gg_core) with PK/SK
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 3.1

### Description
Objective: Execute the task **4.1 – Create DynamoDB table (gg_core) with PK/SK** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Infrastructure (Terraform/CloudFormation, AWS)
Dependencies: 3.1

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

## 4.2 – Setup Cognito User Pool
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 3.1

### Description
Objective: Execute the task **4.2 – Setup Cognito User Pool** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 3.1

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

## 4.3 – Create S3 bucket for static hosting
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 1.1

### Description
Objective: Execute the task **4.3 – Create S3 bucket for static hosting** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Infrastructure (Terraform/CloudFormation, AWS)
Dependencies: 1.1

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
- [ ] Update IaC templates
- [ ] Apply in dev and verify
- [ ] Add logs/metrics/alarms
- [ ] Document rollback

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

## 4.4 – Create API Gateway (REST + AppSync GraphQL)
**Labels:** `Setup & Infrastructure` (blue), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 3.1

### Description
Objective: Execute the task **4.4 – Create API Gateway (REST + AppSync GraphQL)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Setup & Infrastructure
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 3.1

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

## 5.1 – Implement Cognito registration (backend)
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 4.2

### Description
Objective: Execute the task **5.1 – Implement Cognito registration (backend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 4.2

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

## 5.2 – Add DynamoDB user record on signup (backend)
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 5.1,4.1

### Description
Objective: Execute the task **5.2 – Add DynamoDB user record on signup (backend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
Primary Domain(s): Infrastructure (Terraform/CloudFormation, AWS)
Dependencies: 5.1,4.1

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

## 5.3 – Implement confirmation flow (backend)
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 5.1

### Description
Objective: Execute the task **5.3 – Implement confirmation flow (backend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 5.1

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

## 6.1 – Implement Cognito login (backend)
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 5.3

### Description
Objective: Execute the task **6.1 – Implement Cognito login (backend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 5.3

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

## 6.2 – Add JWT middleware in FastAPI
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 6.1

### Description
Objective: Execute the task **6.2 – Add JWT middleware in FastAPI** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 6.1

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

## 6.3 – Verify JWT with Cognito keys
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 6.1

### Description
Objective: Execute the task **6.3 – Verify JWT with Cognito keys** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 6.1

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

## 7.1 – Define DynamoDB schema for USER profiles
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 4.1

### Description
Objective: Execute the task **7.1 – Define DynamoDB schema for USER profiles** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
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

## 7.2 – Write create/update profile service method
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 7.1

### Description
Objective: Execute the task **7.2 – Write create/update profile service method** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 7.1

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

## 7.3 – Write get profile by ID service method
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 7.1

### Description
Objective: Execute the task **7.3 – Write get profile by ID service method** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 7.1

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

## 8.1 – Expose CRUD endpoints in FastAPI (/profile)
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 7.2,7.3

### Description
Objective: Execute the task **8.1 – Expose CRUD endpoints in FastAPI (/profile)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 7.2,7.3

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

## 8.2 – Add validation with Pydantic models
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 8.1

### Description
Objective: Execute the task **8.2 – Add validation with Pydantic models** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 8.1

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

## 8.3 – Unit test all profile endpoints
**Labels:** `Authentication & User Profile` (green), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 8.1

### Description
Objective: Execute the task **8.3 – Unit test all profile endpoints** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Authentication & User Profile
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 8.1

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

## 9.1 – Create registration page (React form)
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 5.1

### Description
Objective: Execute the task **9.1 – Create registration page (React form)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 5.1

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

## 9.2 – Connect registration form to API
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 9.1,5.1

### Description
Objective: Execute the task **9.2 – Connect registration form to API** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 9.1,5.1

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
- [ ] Define request/response DTOs
- [ ] Implement handler/service logic
- [ ] Add error handling and logging
- [ ] Write unit tests for handlers/services
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

## 9.3 – Add error handling and form validation
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 9.1

### Description
Objective: Execute the task **9.3 – Add error handling and form validation** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 9.1

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

## 10.1 – Create profile view page
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 8.1

### Description
Objective: Execute the task **10.1 – Create profile view page** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 8.1

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

## 10.2 – Create edit profile page
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 8.1

### Description
Objective: Execute the task **10.2 – Create edit profile page** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 8.1

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

## 10.3 – Add update call to backend
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 8.1

### Description
Objective: Execute the task **10.3 – Add update call to backend** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 8.1

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

## 11.1 – Define DynamoDB schema for GOAL entity
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 4.1

### Description
Objective: Execute the task **11.1 – Define DynamoDB schema for GOAL entity** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
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

## 11.2 – Write create goal endpoint (backend)
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 11.1

### Description
Objective: Execute the task **11.2 – Write create goal endpoint (backend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 11.1

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

## 11.3 – Add NLP stub for goal questions
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 11.2

### Description
Objective: Execute the task **11.3 – Add NLP stub for goal questions** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 11.2

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

## 12.1 – Write list goals endpoint
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 11.2

### Description
Objective: Execute the task **12.1 – Write list goals endpoint** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 11.2

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
- [ ] Define request/response DTOs
- [ ] Implement handler/service logic
- [ ] Add error handling and logging
- [ ] Write unit tests for handlers/services
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

## 12.2 – Write get goal by ID endpoint
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 11.2

### Description
Objective: Execute the task **12.2 – Write get goal by ID endpoint** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
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

## 13.1 – Build goal creation form (frontend)
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 11.2

### Description
Objective: Execute the task **13.1 – Build goal creation form (frontend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 11.2

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

## 13.2 – Add validation + API integration for goal form
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 13.1

### Description
Objective: Execute the task **13.2 – Add validation + API integration for goal form** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 13.1

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
- [ ] Define request/response DTOs
- [ ] Implement handler/service logic
- [ ] Add error handling and logging
- [ ] Write unit tests for handlers/services
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

## 14.1 – Build goal list page
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 12.1

### Description
Objective: Execute the task **14.1 – Build goal list page** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 12.1

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

## 14.2 – Build goal detail page
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 12.2

### Description
Objective: Execute the task **14.2 – Build goal detail page** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 12.2

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

## 15.1 – Define DynamoDB schema for TASK entity
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 11.1

### Description
Objective: Execute the task **15.1 – Define DynamoDB schema for TASK entity** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Infrastructure (Terraform/CloudFormation, AWS)
Dependencies: 11.1

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

## 15.2 – Create task (backend)
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 15.1

### Description
Objective: Execute the task **15.2 – Create task (backend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 15.1

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

## 15.3 – Update task (backend)
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 15.1

### Description
Objective: Execute the task **15.3 – Update task (backend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 15.1

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

## 15.4 – Delete task (backend)
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 15.1

### Description
Objective: Execute the task **15.4 – Delete task (backend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 15.1

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

## 15.5 – Mark task as complete (backend)
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 15.1

### Description
Objective: Execute the task **15.5 – Mark task as complete (backend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 15.1

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

## 16.1 – Build task list UI component
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 15.2

### Description
Objective: Execute the task **16.1 – Build task list UI component** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 15.2

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

## 16.2 – Add toggle complete button
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 15.5

### Description
Objective: Execute the task **16.2 – Add toggle complete button** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 15.5

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

## 16.3 – Add inline edit/delete actions
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 15.3,15.4

### Description
Objective: Execute the task **16.3 – Add inline edit/delete actions** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 15.3,15.4

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

## 17.1 – Compute goal progress % (backend)
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 15.5

### Description
Objective: Execute the task **17.1 – Compute goal progress % (backend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 15.5

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

## 17.2 – Add milestone schema (backend)
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 17.1

### Description
Objective: Execute the task **17.2 – Add milestone schema (backend)** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Infrastructure (Terraform/CloudFormation, AWS)
Dependencies: 17.1

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

## 17.3 – Return progress in goal API
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 17.1

### Description
Objective: Execute the task **17.3 – Return progress in goal API** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 17.1

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

## 18.1 – Display progress bar in goal detail page
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 17.3

### Description
Objective: Execute the task **18.1 – Display progress bar in goal detail page** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 17.3

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

## 18.2 – Add milestone list UI
**Labels:** `Goals & Tasks` (yellow), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 17.2

### Description
Objective: Execute the task **18.2 – Add milestone list UI** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Goals & Tasks
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 17.2

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

## 19.1 – Define DynamoDB schema for collaborations
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 4.1

### Description
Objective: Execute the task **19.1 – Define DynamoDB schema for collaborations** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
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

## 19.2 – Create collaboration invite endpoint
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 19.1

### Description
Objective: Execute the task **19.2 – Create collaboration invite endpoint** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 19.1

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

## 19.3 – Accept/decline invite endpoint
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 19.1

### Description
Objective: Execute the task **19.3 – Accept/decline invite endpoint** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 19.1

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

## 19.4 – List collaborators endpoint
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 19.1

### Description
Objective: Execute the task **19.4 – List collaborators endpoint** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 19.1

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
- [ ] Define request/response DTOs
- [ ] Implement handler/service logic
- [ ] Add error handling and logging
- [ ] Write unit tests for handlers/services
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

## 20.1 – Create frontend group creation form
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 19.2

### Description
Objective: Execute the task **20.1 – Create frontend group creation form** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 19.2

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

## 20.2 – Display joined groups list
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 19.4

### Description
Objective: Execute the task **20.2 – Display joined groups list** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 19.4

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

## 20.3 – Display group details
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 19.4

### Description
Objective: Execute the task **20.3 – Display group details** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 19.4

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

## 21.1 – Setup WebSocket endpoint in FastAPI
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 3.1

### Description
Objective: Execute the task **21.1 – Setup WebSocket endpoint in FastAPI** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 3.1

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

## 21.2 – Implement message persistence in DynamoDB
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 21.1

### Description
Objective: Execute the task **21.2 – Implement message persistence in DynamoDB** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Infrastructure (Terraform/CloudFormation, AWS)
Dependencies: 21.1

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

## 21.3 – Broadcast messages to connected clients
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 21.2

### Description
Objective: Execute the task **21.3 – Broadcast messages to connected clients** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 21.2

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

## 22.1 – Build chat UI component
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 21.1

### Description
Objective: Execute the task **22.1 – Build chat UI component** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 21.1

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

## 22.2 – Connect WebSocket client
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 21.3

### Description
Objective: Execute the task **22.2 – Connect WebSocket client** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB)
Dependencies: 21.3

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

## 22.3 – Add typing indicator & timestamps
**Labels:** `Collaboration & Chat` (orange), `Phase 1 – Foundation` (sky)
**Dependencies:**

> **2025-09-24 – Dependencies**
> 22.1

### Description
Objective: Execute the task **22.3 – Add typing indicator & timestamps** with precise, reproducible steps so an AI agent or developer can complete it autonomously.
Phase: Phase 1 – Foundation
Category: Collaboration & Chat
Primary Domain(s): Backend (FastAPI, Python, AppSync/DynamoDB), Frontend (React 18 + TypeScript + Tailwind)
Dependencies: 22.1

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
