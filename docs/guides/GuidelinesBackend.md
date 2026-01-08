# Python Backend Coding Rules and Guidelines

---

## Table of Contents

1. [Python Coding Style Preferences](#python-coding-style-preferences)  
2. [Infrastructure as Code (IaC) - Terraform Conventions](#infrastructure-as-code-iac---terraform-conventions)  
3. [Microservice Architecture Guidelines](#microservice-architecture-guidelines)  
4. [External Documentation and References](#external-documentation-and-references)  

---

## 1. Python Coding Style Preferences

### 1.1 Indentation & Formatting
- Use 4 spaces per indentation level (no tabs).
- Maximum line length: 79 characters (soft limit), 99 characters (hard limit).
- Use blank lines to separate top-level functions and classes, and method definitions inside classes.
- Use trailing commas in multi-line collections for cleaner diffs.
- Use consistent string quoting (prefer single quotes `'` unless string contains single quote).

### 1.2 Naming Conventions (PEP 8 Compliance)
- **Modules and packages:** lowercase with underscores (e.g., `user_service.py`).
- **Classes:** CapWords (PascalCase), e.g., `UserManager`.
- **Functions and variables:** lowercase_with_underscores, e.g., `get_user_data`.
- **Constants:** UPPERCASE_WITH_UNDERSCORES, e.g., `MAX_RETRIES`.
- **Private members:** prefix with a single underscore `_private_method`.
- Avoid single character names except for counters or iterators (`i`, `j`).

### 1.3 File Organization & Module Structure
- Organize code by feature or domain, not by type.
- Each module should have a clear responsibility.
- Use `__init__.py` to mark packages.
- Keep modules small and focused (ideally < 200 lines).
- Group related modules into packages.
- Separate business logic, data access, and API handlers clearly.
- Use type hints consistently for all functions and methods.
- Use docstrings for all public modules, classes, and functions following [PEP 257](https://www.python.org/dev/peps/pep-0257/).

### 1.4 Project-Specific Modifications
- Enforce strict typing with `mypy` in CI pipelines.
- Use `black` for code formatting with default settings.
- Use `isort` for import sorting.
- Avoid wildcard imports.
- Use explicit relative imports within packages.
- Use `logging` module for all logging; no print statements.
- Use environment variables for configuration; do not hardcode secrets.
- Use `dataclasses` for simple data structures where appropriate.

### 1.5 Example Python Function
```python
from typing import Optional

class UserManager:
  def __init__(self, db_client):
    self._db_client = db_client

  def get_user(self, user_id: str) -> Optional[dict]:
    """
    Retrieve user data by user_id.

    Args:
      user_id (str): Unique identifier for the user.

    Returns:
      Optional[dict]: User data dictionary or None if not found.
    """
    user = self._db_client.fetch_user(user_id)
    return user
```

---

## 2. Infrastructure as Code (IaC) - Terraform Conventions

### 2.1 File Structure
- Organize Terraform code by environment and service:
  ```
  infra/
    terraform/
      modules/
        service_a/
          main.tf
          variables.tf
          outputs.tf
          README.md
        service_b/
      envs/
        dev/
          main.tf
          variables.tf
        prod/
          main.tf
          variables.tf
  ```
- Use modules for reusable components.
- Keep environment-specific overrides separate.

### 2.2 Naming Conventions
- Resource names: lowercase, hyphen-separated, descriptive (e.g., `aws_lambda_function.medieval_goals_api`).
- Variables: lowercase_with_underscores (e.g., `lambda_memory_size`).
- Outputs: lowercase_with_underscores.
- Module names: lowercase with underscores.

### 2.3 Documentation Standards
- Each module must have a `README.md` describing:
  - Purpose of the module.
  - Inputs and outputs.
  - Usage examples.
- Use comments liberally to explain complex logic.
- Document variable defaults and constraints in `variables.tf`.

### 2.4 Project-Specific Rules
- Use Terraform 1.x syntax and features.
- Use `terraform fmt` and `terraform validate` in CI.
- Avoid hardcoding values; use variables and environment variables.
- Use descriptive tags for AWS resources (e.g., `Environment`, `Project`, `Owner`).
- Use version pinning for providers and modules.
- Use remote state with locking enabled.

### 2.5 Example Terraform Resource
```hcl
resource "aws_lambda_function" "medieval_goals_api" {
  function_name = "medieval-goals-api"
  role          = var.lambda_role_arn
  handler       = "app.lambda_handler"
  runtime       = "python3.9"
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  filename      = var.lambda_package_path

  tags = {
    Environment = var.environment
    Project     = "medieval-goals"
  }
}
```

---

## 3. Microservice Architecture Guidelines

### 3.1 Service Boundaries
- Each microservice must have a single, well-defined responsibility.
- Services should be loosely coupled and independently deployable.
- Avoid shared databases; each service owns its data.
- Use domain-driven design principles to define service boundaries.

### 3.2 Inter-Service Communication
- Prefer asynchronous communication (e.g., AWS SNS, SQS) where possible.
- For synchronous calls, use RESTful APIs via API Gateway.
- Use OpenAPI (Swagger) specifications for API contracts.
- Implement retries with exponential backoff on client side.
- Use authentication and authorization on all service endpoints (e.g., AWS Cognito).

### 3.3 API Design Standards
- Use RESTful principles: resource-based URLs, HTTP verbs, and status codes.
- Use JSON as the data interchange format.
- Include pagination, filtering, and sorting on list endpoints.
- Use consistent error response format with error codes and messages.
- Version APIs explicitly in the URL (e.g., `/v1/goals`).

### 3.4 Repository Organization
- Prefer one repository per microservice.
- Each repo contains:
  - Source code
  - IaC for that service (Terraform modules or environment configs)
  - Tests (unit, integration)
  - README with setup, deployment, and API docs
- Use CI/CD pipelines per repository.
- Use semantic versioning for releases.

### 3.5 Example API Endpoint Design
```
GET /v1/users/{user_id}
Response:
{
  "id": "123",
  "name": "Sir Lancelot",
  "email": "lancelot@roundtable.com"
}
```

---

## 4. External Documentation and References

| Topic                  | Reference Link                                                                                   | Notes on Deviations or Additions                          |
|------------------------|------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| Python Style Guide     | https://peps.python.org/pep-0008/                                                               | Follow strictly except line length soft limit extended to 99 chars for readability. Use `black` and `mypy`. |
| Python Docstrings      | https://peps.python.org/pep-0257/                                                               | Use Google style or NumPy style docstrings consistently. |
| Terraform Style Guide  | https://www.terraform.io/docs/language/syntax/style.html                                        | Follow official guide; add project-specific naming and module structure rules. |
| REST API Design        | https://restfulapi.net/                                                                         | Follow REST principles strictly; use OpenAPI specs.      |
| AWS Lambda Best Practices | https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html                              | Follow AWS recommendations for Lambda container images. |

---

## Summary

This document provides clear, actionable guidelines for Python backend development, Terraform infrastructure code, and microservice architecture design tailored for AWS Lambda container deployments with API Gateway. It is designed to onboard new developers efficiently and maintain high code quality and operational standards.

---

**End of guidelines**
