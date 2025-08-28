# Network Module

This module provisions the network-related AWS resources required for GoalsGuild backend services, including:

- IAM Role for Lambda execution
- Cognito User Pool and User Pool Client for authentication
- API Gateway REST API and resources
- API Gateway Cognito Authorizer

## Usage

```hcl
module "network" {
  source      = "./modules/network"
  environment = var.environment
  aws_region  = var.aws_region
}
```

## Inputs

| Name        | Type   | Description                      |
|-------------|--------|--------------------------------|
| environment | string | Deployment environment (dev/prod) |
| aws_region  | string | AWS region to deploy resources  |

## Outputs

| Name                 | Description                          |
|----------------------|------------------------------------|
| lambda_exec_role_arn  | ARN of the IAM role for Lambda      |
| cognito_user_pool_id  | ID of the Cognito User Pool         |
| api_gateway_rest_api_id | ID of the API Gateway REST API    |

## Notes

- The Lambda execution role includes basic execution permissions.
- Cognito User Pool is configured with email as username and password policy.
- API Gateway is configured with resources for user and quest services.
- The Cognito authorizer is set up for API Gateway to secure endpoints.
