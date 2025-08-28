# GoalsGuild Backend Services

This directory contains the Python backend microservices for the GoalsGuild project, implemented as AWS Lambda container images.

## Services

- **user-service**: Manages user profiles, preferences, and authentication integration.
- **quest-service**: Manages quests creation and listing.

## Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions.
- Docker installed and configured.
- AWS ECR repositories created for each service.
- DynamoDB tables created:
  - `goalsguild_users`
  - `goalsguild_quests`

### Build and Push Docker Images

For each service (`user-service` and `quest-service`), run:

```sh
cd backend/services/<service-name>
docker build -t <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<service-name>:latest .
docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<service-name>:latest
```

Replace `<aws_account_id>`, `<region>`, and `<service-name>` accordingly.

### Deploy Lambda Functions

Create or update AWS Lambda functions using the container images pushed to ECR.

Example AWS CLI command:

```sh
aws lambda create-function \
  --function-name goalsguild-<service-name> \
  --package-type Image \
  --code ImageUri=<aws_account_id>.dkr.ecr.<region>.amazonaws.com/<service-name>:latest \
  --role <lambda_execution_role_arn> \
  --timeout 30 \
  --memory-size 512
```

### Environment Variables

Set the following environment variables for each Lambda function:

- `USERS_TABLE` for user-service (default: `goalsguild_users`)
- `QUESTS_TABLE` for quest-service (default: `goalsguild_quests`)

### Notes

- The services expect JWT tokens in the `Authorization` header as `Bearer <token>`.
- Token signature verification is disabled for simplicity; consider enabling it for production.
- DynamoDB tables must have appropriate primary keys:
  - `goalsguild_users`: `user_id` (string, primary key)
  - `goalsguild_quests`: `quest_id` (string, primary key)
- Enable Row Level Security and policies in Supabase if you migrate to it later.

## Local Testing

You can run the FastAPI app locally with:

```sh
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Then test endpoints with a valid JWT token.
