# Questbound Backend Microservices

This repository contains the backend microservices for the Questbound Forge application. The backend is designed as a set of modular microservices deployed as AWS Lambda container images, exposed via AWS API Gateway, and secured with AWS Cognito authentication.

---

## Architecture Overview

- **Microservices**: Each service is a Node.js Express app containerized for AWS Lambda.
- **Authentication**: AWS Cognito User Pool for user sign-up/sign-in and JWT-based authorization.
- **API Gateway**: REST APIs exposing microservices endpoints with Cognito authorizer.
- **Database**: DynamoDB tables provisioned per service.
- **Infrastructure**: Provisioned using Terraform.

---

## Services

1. **User Service**  
   Manages user profiles and preferences.

2. **Quest Service**  
   Manages quests, including creation, listing, and user quest progress.

---

## Prerequisites

- AWS CLI configured with appropriate permissions.
- Docker installed for building container images.
- Terraform installed (v1.x recommended).
- AWS account with permissions to create Cognito, Lambda, API Gateway, DynamoDB, IAM resources.

---

## Setup and Deployment

### 1. Configure AWS Cognito User Pool

Terraform will create a Cognito User Pool and User Pool Client. Users can sign up and sign in with email and password.

### 2. Build and Push Lambda Container Images

Each service has a Dockerfile. Build and push images to Amazon ECR:

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com

# Build and tag images
docker build -t questbound-user-service backend/services/user-service
docker tag questbound-user-service:latest <aws_account_id>.dkr.ecr.<region>.amazonaws.com/questbound-user-service:latest

docker build -t questbound-quest-service backend/services/quest-service
docker tag questbound-quest-service:latest <aws_account_id>.dkr.ecr.<region>.amazonaws.com/questbound-quest-service:latest

# Push images
docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/questbound-user-service:latest
docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/questbound-quest-service:latest
```

### 3. Deploy Infrastructure with Terraform

```bash
cd backend/infra
terraform init
terraform apply
```

This will provision Cognito, API Gateway, Lambda functions (linked to ECR images), DynamoDB tables, and IAM roles.

### 4. Test the APIs

Use the API Gateway endpoints output by Terraform. Authenticate with Cognito to get JWT tokens and call the APIs with Authorization headers.

---

## Development

- Services are in `backend/services/`.
- Use `npm install` and `npm run dev` for local development.
- Use AWS SAM or local Lambda emulators for local testing if needed.

---

## Security

- All APIs require Cognito JWT authorization.
- IAM roles follow least privilege.
- DynamoDB tables have fine-grained access control via service roles.

---

## Notes

- Email confirmation is disabled in Cognito for simplicity.
- No destructive database operations are performed.
- Follow the coding guidelines in `GuidelinesBackend.md`.

---

## Contact

For questions or support, contact the backend team.
