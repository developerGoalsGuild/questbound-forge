# Guild Service

The Guild Service is a FastAPI-based microservice that manages guild operations for the GoalsGuild platform, including guild creation, membership management, moderation, comments, analytics, and rankings.

## Architecture

### Technology Stack
- **Framework**: FastAPI (Python 3.12)
- **Database**: DynamoDB (gg_guild table)
- **Storage**: AWS S3 (guild avatars)
- **Authentication**: AWS Lambda Authorizer
- **Deployment**: AWS Lambda + API Gateway

### Service Components

#### API Endpoints (FastAPI Routers)
- `guild.py` - Guild CRUD operations, membership management
- `avatar.py` - Avatar upload/download operations
- `comments.py` - Guild comments and discussions
- `analytics.py` - Guild analytics and leaderboards
- `moderation.py` - Join requests, ownership transfer, moderation actions

#### Database Operations
- `guild_db.py` - DynamoDB operations for guilds, members, comments, join requests

#### Models (Pydantic)
- `guild.py` - Guild, GuildCreatePayload, GuildUpdatePayload, GuildResponse
- `join_request.py` - GuildJoinRequest, GuildJoinRequestListResponse
- `moderation.py` - TransferOwnershipRequest, ModerationActionPayload
- `avatar.py` - AvatarUploadRequest, AvatarUploadResponse
- `comment.py` - GuildComment, CommentCreatePayload, CommentUpdatePayload
- `analytics.py` - GuildAnalytics, MemberLeaderboardItem

## Infrastructure

### DynamoDB Table: gg_guild

**Primary Key**:
- PK: `GUILD#{guildId}` or `USER#{userId}`
- SK: `METADATA#{guildId}` or `MEMBER#{userId}` or `COMMENT#{commentId}` or `JOIN_REQUEST#{userId}`

**Global Secondary Indexes**:
- **GSI1**: Guild Type Index (PK: `GUILD#{guildType}`, SK: `CREATED_AT#{timestamp}`)
- **GSI2**: Created By Index (PK: `USER#{userId}`, SK: `GUILD#{guildId}`)
- **GSI3**: User Membership Index (PK: `USER#{userId}`, SK: `GUILD#{guildId}`)
- **GSI4**: Comment Thread Index (PK: `GUILD#{guildId}#COMMENT_THREAD#{parentId}`, SK: `CREATED_AT#{timestamp}`)
- **GSI5**: User Comments Index (PK: `USER#{userId}`, SK: `COMMENT_IN_GUILD#{guildId}#{commentId}`)

### S3 Bucket: guild-avatars

**Configuration**:
- Versioning: Enabled
- Encryption: AES256
- Public Access: Blocked
- CORS: Configured for frontend access
- Lifecycle: Configurable per environment

### API Gateway Routes

All routes are prefixed with `/guilds` and require authentication via Lambda Authorizer:

**Guild Operations**:
- `GET /guilds` - List guilds
- `POST /guilds` - Create guild
- `GET /guilds/{guild_id}` - Get guild details
- `PUT /guilds/{guild_id}` - Update guild
- `DELETE /guilds/{guild_id}` - Delete guild

**Membership**:
- `POST /guilds/{guild_id}/join` - Join guild
- `POST /guilds/{guild_id}/leave` - Leave guild
- `DELETE /guilds/{guild_id}/members/{user_id}` - Remove member
- `GET /users/{user_id}/guilds` - List user's guilds

**Avatar Management**:
- `POST /guilds/{guild_id}/avatar/upload-url` - Get presigned upload URL
- `POST /guilds/{guild_id}/avatar/confirm` - Confirm avatar upload
- `GET /guilds/{guild_id}/avatar` - Get avatar URL
- `DELETE /guilds/{guild_id}/avatar` - Delete avatar

**Comments**:
- `GET /guilds/{guild_id}/comments` - List comments
- `POST /guilds/{guild_id}/comments` - Create comment
- `PUT /guilds/{guild_id}/comments/{comment_id}` - Update comment
- `DELETE /guilds/{guild_id}/comments/{comment_id}` - Delete comment
- `POST /guilds/{guild_id}/comments/{comment_id}/like` - Like/unlike comment

**Analytics**:
- `GET /guilds/{guild_id}/analytics` - Get guild analytics
- `GET /guilds/{guild_id}/analytics/leaderboard` - Get member leaderboard
- `GET /guilds/rankings` - Get guild rankings

**Join Requests** (Approval-Required Guilds):
- `POST /guilds/{guild_id}/join-requests` - Create join request
- `GET /guilds/{guild_id}/join-requests` - List join requests
- `PUT /guilds/{guild_id}/join-requests/{user_id}/approve` - Approve request
- `PUT /guilds/{guild_id}/join-requests/{user_id}/reject` - Reject request

**Moderation**:
- `POST /guilds/{guild_id}/ownership/transfer` - Transfer ownership
- `POST /guilds/{guild_id}/moderators/assign` - Assign moderator
- `DELETE /guilds/{guild_id}/moderators/{user_id}` - Remove moderator
- `POST /guilds/{guild_id}/moderation/action` - Perform moderation action

### EventBridge

**Guild Ranking Calculation Rule**:
- Schedule: Configurable (default: hourly)
- Target: Guild Service Lambda
- Action: Calculate and update guild rankings

### SSM Parameters

Configuration stored at `/goalsguild/guild-service/config`:
- `ENVIRONMENT` - Environment name
- `GUILD_TABLE_NAME` - DynamoDB table name
- `AVATAR_S3_BUCKET` - S3 bucket for avatars
- `ALLOWED_ORIGINS` - CORS allowed origins
- `RATE_LIMIT_REQUESTS_PER_HOUR` - Rate limiting
- `AVATAR_MAX_SIZE_MB` - Max avatar size
- `AVATAR_ALLOWED_TYPES` - Allowed avatar MIME types
- `RANKING_CALCULATION_FREQUENCY` - Ranking update frequency

## Features

### Guild Types
- **Public**: Anyone can join
- **Private**: Invite-only
- **Approval-Required**: Owner/moderator approval needed

### Roles
- **Owner**: Full control, can transfer ownership
- **Moderator**: Can approve join requests, moderate comments, manage members
- **Member**: Can participate in guild activities

### Moderation Actions
- Block/unblock users from commenting
- Remove users from guild
- Delete comments
- Toggle comment permissions
- Assign/remove moderator roles

### Analytics
- Total members, active members, new members
- Goal/quest statistics and completion rates
- Member leaderboard by score/activity
- Guild rankings by overall performance

## Development

### Local Setup
```bash
cd backend/services/guild-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Running Locally
```bash
uvicorn app.main:app --reload --port 8003
```

### Testing
```bash
pytest tests/
```

## Deployment

### Terraform
```bash
cd backend/infra/terraform2

# Deploy S3 bucket
cd stacks/s3
terraform init
terraform apply

# Deploy DynamoDB table
cd ../database
terraform init
terraform apply

# Deploy guild service
cd ../services/guild-service
terraform init
terraform apply

# Update API Gateway
cd ../../modules/apigateway
terraform init
terraform apply
```

### Manual Deployment
See deployment scripts in `backend/infra/terraform2/scripts/`

## Security

- All endpoints require authentication via Lambda Authorizer
- Rate limiting on sensitive operations
- Input validation using Pydantic
- S3 bucket access control and encryption
- DynamoDB encryption at rest
- CORS configuration for frontend access

## Monitoring

- CloudWatch Logs: `/aws/lambda/goalsguild-guild-service-{env}`
- CloudWatch Metrics: Lambda invocations, errors, duration
- EventBridge monitoring for ranking calculations

## Next Steps

1. Complete AppSync GraphQL schema integration
2. Update deployment scripts for guild service
3. Implement comprehensive unit and integration tests
4. Add performance monitoring and alerting
5. Document API endpoints with OpenAPI/Swagger


