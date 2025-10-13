# Collaboration Service

A FastAPI-based AWS Lambda service for managing collaboration features in GoalsGuild, including invites, collaborators, threaded comments, and emoji reactions.

## Features

- **Collaboration Invites**: Send, accept, and decline collaboration requests
- **Collaborator Management**: Add/remove collaborators from goals and quests
- **Threaded Comments**: Full discussion system with @mentions
- **Emoji Reactions**: 5 emoji types (👍❤️😂😢😠) for commenting
- **Permission System**: Resource ownership and access control
- **Audit Logging**: Comprehensive structured logging

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI       │    │   DynamoDB      │    │   Cognito       │
│   Lambda        │◄──►│   gg_core       │◄──►│   JWT Auth      │
│                 │    │   Single Table  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │ CloudWatch      │    │   Frontend      │
│   REST API      │    │ Monitoring      │    │   React App     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Endpoints

### Collaboration Invites
- `POST /collaborations/invites` - Send collaboration invite
- `GET /collaborations/invites` - List user's invites
- `POST /collaborations/invites/{id}/accept` - Accept invite
- `POST /collaborations/invites/{id}/decline` - Decline invite

### Collaborator Management
- `GET /collaborations/resources/{type}/{id}/collaborators` - List collaborators
- `DELETE /collaborations/resources/{type}/{id}/collaborators/{userId}` - Remove collaborator

### Comments System
- `POST /collaborations/comments` - Create comment
- `GET /collaborations/comments/{id}` - Get comment
- `GET /collaborations/resources/{type}/{id}/comments` - List resource comments
- `PUT /collaborations/comments/{id}` - Update comment
- `DELETE /collaborations/comments/{id}` - Delete comment

### Reactions System
- `POST /collaborations/comments/{id}/reactions` - Toggle reaction
- `GET /collaborations/comments/{id}/reactions` - Get comment reactions

## Local Development

### Prerequisites
- Python 3.12+
- Docker
- AWS CLI configured

### Environment Setup

Before running the service, set up the required AWS SSM parameters:

```bash
# Navigate to scripts directory
cd backend/services/collaboration-service/scripts

# Setup environment variables (dry run first)
.\setup-env-variables.ps1 -Environment dev -DryRun
.\setup-env-variables.ps1 -Environment dev

# Setup JWT secret (dry run first)
.\setup-jwt-secret.ps1 -Environment dev -DryRun
.\setup-jwt-secret.ps1 -Environment dev
```

### Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

### Testing
```bash
# Run unit tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html
```

## Deployment

### Automated Deployment
```bash
# Full deployment (build + terraform)
.\deploy.ps1 -Environment dev

# Build only
.\build.ps1 -ImageTag v1.0.0

# Terraform only
cd ../../infra/terraform2
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

### Manual Deployment Steps

1. **Build Docker Image**:
   ```bash
   .\build.ps1 -ImageTag latest
   ```

2. **Deploy Infrastructure**:
   ```bash
   cd ../../infra/terraform2
   terraform init
   terraform plan -var-file=environments/dev.tfvars
   terraform apply -var-file=environments/dev.tfvars
   ```

3. **Verify Deployment**:
   ```bash
   # Check Lambda function
   aws lambda get-function --function-name collaboration-service-dev

   # Test health endpoint
   curl https://api.goalsguild.com/collaborations/health
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment | `dev` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `DYNAMODB_TABLE_NAME` | DynamoDB table name | `gg_core` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID | - |
| `COGNITO_USER_POOL_CLIENT_ID` | Cognito Client ID | - |

## Database Schema

### Entity Types
- **CollaborationInvite**: Invite records with TTL (30 days)
- **Collaborator**: Active collaborators with join dates
- **Comment**: Threaded comments with @mentions
- **Reaction**: Emoji reactions on comments

### Key Patterns
```
PK: RESOURCE#{resourceType}#{resourceId}
SK: INVITE#{inviteId} | COLLABORATOR#{userId} | COMMENT#{timestamp}#{commentId}
GSI1PK: USER#{userId}
GSI1SK: INVITE#{status}#{createdAt} | COLLAB#{resourceType}#{joinedAt}
```

## Monitoring

### CloudWatch Alarms
- **Errors**: > 5 errors in 5 minutes
- **Duration**: > 10 seconds average
- **Throttles**: Any throttling events

### Logs
```bash
# Tail Lambda logs
aws logs tail /aws/lambda/collaboration-service-dev --follow

# Filter by request ID
aws logs filter-log-events --log-group-name /aws/lambda/collaboration-service-dev --filter-pattern "ERROR"
```

## Security

### Authentication
- Cognito JWT token validation
- Bearer token in Authorization header

### Authorization
- Resource ownership verification
- Collaborator access control
- Input sanitization and validation

### Data Protection
- No sensitive data in logs
- Secure environment variable handling
- CORS policy enforcement

## Troubleshooting

### Common Issues

1. **Import Errors**:
   ```bash
   # Check Python path
   python -c "import sys; print('\n'.join(sys.path))"
   ```

2. **DynamoDB Connection**:
   ```bash
   # Test DynamoDB connectivity
   aws dynamodb list-tables --region us-east-1
   ```

3. **Lambda Timeouts**:
   - Increase timeout in Terraform (currently 30s)
   - Check for slow database queries
   - Monitor CloudWatch metrics

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
uvicorn app.main:app --reload --log-level debug
```

## Performance Optimization

### Current Configuration
- **Memory**: 512MB
- **Timeout**: 30 seconds
- **Reserved Concurrency**: None

### Optimization Opportunities
- Implement response caching
- Add database query optimization
- Consider API Gateway caching
- Monitor and adjust memory allocation

## Contributing

1. Follow the existing code patterns
2. Add comprehensive tests for new features
3. Update this README for API changes
4. Ensure all linting passes
5. Test locally before deploying

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review API Gateway metrics
3. Test with local development server
4. Check DynamoDB table metrics

