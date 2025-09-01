# User Services Environment Variables Management via AWS SSM Parameter Store

## Overview

This document describes how the User Services application securely manages its environment variables using AWS Systems Manager (SSM) Parameter Store. Instead of using multiple environment variables, a single JSON parameter stores all required variables (except `AWS_REGION`), enabling centralized, secure, and consistent configuration management.

---

## 1. Creating the SSM Parameter

- The parameter is created in the Terraform Network Infrastructure module as a `String` type containing a JSON object.
- The JSON maps each environment variable name to its value.
- Example JSON structure:

```json
{
  "COGNITO_USER_POOL_ID": "us-east-1_XXXXXXXXX",
  "COGNITO_CLIENT_ID": "xxxxxxxxxxxxxxxxxxxxxxxxxx",
  "COGNITO_CLIENT_SECRET": "xxxxxxxxxxxxxxxxxxxxxxxxxx",
  "EMAIL_SENDER": "no-reply@goalsguild.com",
  "FRONTEND_BASE_URL": "https://app.goalsguild.com",
  "PASSWORD_KEY": "your-encrypted-password-key"
}
```

- The parameter name follows the convention: `/goalsguild/{environment}/user-service/env_vars`

---

## 2. Terraform Integration

- The parameter is defined in `backend/infra/terraform/modules/network/main.tf`.
- IAM policy attached to the Lambda execution role grants `ssm:GetParameter` permission on this parameter.
- This ensures the User Services application can securely read the parameter at runtime.

---

## 3. IAM Permissions

- The Lambda execution role has a policy allowing `ssm:GetParameter` on the specific parameter ARN.
- This follows the principle of least privilege.
- No other services or roles have access unless explicitly granted.

---

## 4. Backend Application Changes

- The User Services backend fetches the JSON parameter at startup and caches it in memory.
- A TTL (default 5 minutes) is used to refresh the cache periodically.
- All environment variables (except `AWS_REGION`) are accessed from this cached config.
- This reduces latency and API calls to SSM.
- The `AWS_REGION` environment variable remains directly set in the Lambda environment for AWS SDK configuration.

---

## 5. Caching Strategy

- Cache expiry time is configurable (default 300 seconds).
- On cache expiry, the backend fetches the latest parameter value from SSM.
- This allows updates to environment variables without redeploying the service.
- If the parameter is missing or malformed, the service raises an error on startup or refresh.

---

## 6. Updating Environment Variables

- To update environment variables:
  1. Modify the JSON value in the SSM parameter via Terraform or AWS Console.
  2. The backend will pick up changes after the cache TTL expires.
  3. For immediate effect, restart the backend service to reload config.

- Always ensure the JSON structure is valid and contains all required keys.

---

## 7. Security Considerations

- Sensitive values like `COGNITO_CLIENT_SECRET` and `PASSWORD_KEY` are stored encrypted in SSM.
- The backend requests the parameter with decryption enabled.
- IAM policies restrict access to only the User Services Lambda role.
- Avoid logging sensitive values.

---

## 8. Summary

| Aspect               | Details                                      |
|----------------------|----------------------------------------------|
| Parameter Name       | `/goalsguild/{environment}/user-service/env_vars` |
| Parameter Type       | String (JSON)                                |
| IAM Permissions      | `ssm:GetParameter` on parameter ARN          |
| Cache TTL            | 300 seconds (configurable)                    |
| Backend Env Vars     | Loaded from cached JSON parameter             |
| AWS_REGION           | Remains direct environment variable           |

---

For questions or issues, contact the DevOps or Backend team.
