Title: Migrate AppSync createUser → Python Lambda (user-service)

Overview
- Decommissioned the AppSync Mutation.createUser resolver and pipeline.
- Consolidated signup into the containerized Python Lambda (FastAPI) at /users/signup.
- The Lambda performs password strength validation and now also persists the user profile into gg_core (single-table) matching the original AppSync pattern.
- Frontend updated to call API Gateway /users/signup directly; other GraphQL resolvers unchanged.

Scope
- AppSync
  - Removed resolver + functions for Mutation.createUser.
  - Left other resolvers intact (createGoal, addTask, etc.).
- Lambda (user-service)
  - Extended /signup (local) to accept optional profile fields (nickname, birthDate, country, language, pronouns, bio, tags, status) and to write to gg_core (email lock + profile item).
  - Validates: email format (pydantic), password strength, country allow-list, birthDate ≤ today−1yr.
- Infra
  - SSM env_vars now include CORE_TABLE (gg_core table name) for the user-service.
  - AppSync module no longer defines createUser resolver or functions.
- Frontend
  - createUser now calls REST: POST {VITE_API_BASE_URL}/users/signup with provider: 'local'.

Implementation Details
- Python service changes
  - File: backend/services/user-service/app/models.py
    - Extended SignupLocal with profile fields.
  - File: backend/services/user-service/app/ssm.py
    - Added core_table_name from SSM env_vars (CORE_TABLE).
  - File: backend/services/user-service/app/main.py
    - In /signup (provider=local), after user record, write gg_core:
      - Put EMAIL#<email> UNIQUE#USER with conditional attribute_not_exists(PK)
      - Put USER#<id> PROFILE#<id> with same GSIs and attributes as AppSync createUser.
      - Validates country + birthDate before write.
- Terraform
  - File: backend/infra/terraform/main.tf
    - Removed Mutation.createUser resolver and functions mapping.
    - Passed ddb_table_name to network module.
  - File: backend/infra/terraform/modules/network/variables.tf
    - Added ddb_table_name variable.
  - File: backend/infra/terraform/modules/network/ssm.tf
    - Added CORE_TABLE to user_service_env_vars parameter.
  - Removed resolver files:
    - backend/infra/terraform/resolvers/createUser.js
    - backend/infra/terraform/resolvers/createUser.pipeline.js
    - backend/infra/terraform/resolvers/persistUser.js
    - backend/infra/terraform/resolvers/__tests__/createUser.test.js
    - backend/infra/terraform/resolvers/__tests__/persistUser.test.js

Frontend
- File: frontend/src/lib/api.ts
  - createUser now posts to {VITE_API_BASE_URL}/users/signup with payload that includes provider, email/password/name, and optional profile fields.
- Env
  - File: frontend/.env.example, .env.development
    - Added VITE_API_BASE_URL.

Testing
- Add unit tests under backend/services/user-service/tests for /signup:
  - Valid email required (pydantic EmailStr)
  - Password strength validated by validate_password_strength
  - Country allow-list enforced
  - BirthDate format + age ≥ 1 year enforced
  - gg_core items written with expected keys (email lock + user profile)
- Integration tests
  - Use FastAPI TestClient + moto to mock DynamoDB + SSM env_vars (CORE_TABLE, DYNAMODB_USERS_TABLE).
  - Verify 409 on duplicate email lock.

Rollout
1) terraform init && terraform apply in backend/infra/terraform.
2) Set VITE_API_BASE_URL for frontend (e.g., https://{restApiId}.execute-api.{region}.amazonaws.com/{stage}).
3) Frontend will call /users/signup. AppSync createUser is decommissioned.

Security
- Passwords are hashed server-side; plaintext is never stored.
- Email uniqueness enforced via conditional write.
- Validation ensures consistent, secure input handling.

