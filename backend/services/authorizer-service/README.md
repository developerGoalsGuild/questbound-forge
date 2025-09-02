# Authorizer Service

This directory contains the AWS Lambda function `authorizer-service` which acts as a custom API Gateway authorizer supporting:

- Native user authentication (username/password) validated against DynamoDB.
- Social login via AWS Cognito JWT token validation.

## Structure

- `authorizer.py`: Lambda function code.
- `requirements.txt`: Python dependencies.
- `package.sh`: Script to package the Lambda function for deployment.
- `README.md`: This documentation.

## Deployment

1. Ensure Python 3.9+ and `pip` are installed.
2. Run `./package.sh` to create `authorizer.zip` with dependencies.
3. Upload `authorizer.zip` to your Terraform module directory or S3 bucket as needed.
4. Run Terraform apply to deploy the Lambda function and related resources.

## DynamoDB Schema

The DynamoDB table for native users must have the following attributes:

- `username` (string) - Partition key
- `password_hash` (string) - HMAC-SHA256 hashed password with salt
- `salt` (string) - Salt used for hashing

Ensure the table has a primary key on `username`.

## Testing

Unit tests are located in the `tests/` directory (not included here). They use `pytest` and `moto` to mock AWS services.

Run tests with:

```bash
pytest tests/
```

## Environment Variables

- `ENVIRONMENT`: Deployment environment (default: `dev`).
- AWS credentials and permissions must be configured for deployment and runtime.

## Notes

- The Lambda function automatically creates missing SSM parameters with placeholder values.
- Replace placeholder values in SSM after deployment.
- Follow AWS best practices for IAM roles and policies.
