# Questbound Forge Architecture Guide

This guide provides a comprehensive overview of the Questbound Forge application's architecture. It serves as a reference for AI systems to replicate this project pattern for future features and understand the design principles, AWS services, security patterns, and technology stack.

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [AWS Services Used](#aws-services-used)
3. [Database Architecture](#database-architecture)
4. [Backend Services Architecture](#backend-services-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Security Patterns](#security-patterns)
7. [Libraries and Dependencies](#libraries-and-dependencies)
8. [Infrastructure as Code](#infrastructure-as-code)
9. [Development Patterns](#development-patterns)
10. [Deployment Patterns](#deployment-patterns)

## High-Level Architecture

Questbound Forge is a serverless, cloud-agnostic goal-tracking application designed to scale to 1,000,000+ users. The architecture follows these principles:

- **Serverless-first**: Minimal operational overhead using AWS managed services
- **Cloud-agnostic**: Designed for portability to other cloud providers
- **GraphQL-first**: Primary API layer using AWS AppSync for select operations.
- **Single-table database**: DynamoDB with comprehensive GSI patterns named gg_core
- **Microservices**: Modular Lambda functions for business logic
- **Event-driven**: Async processing with EventBridge, SQS, and SNS
- **Hybrid social feed**: fan-in (query-on-demand) by default; selective fan-out (materialized feeds) for power users/groups using DynamoDB Streams → SQS → Lambda. Lambda-backed mutations for all writes.
- **Asynchronous chat**: room-partitioned messages in DynamoDB with AppSync queries/subscriptions; optional push via SNS.
- **Hybrid groups**: start as project rooms tied to a goal; graduate to persistent communities (multiple goals/threads) when active.

### Client Architecture
- **Web Frontend**: React/TypeScript SPA with Apollo GraphQL client
- **Mobile Ready**: API design supports mobile clients
- **Real-time**: GraphQL subscriptions for live updates

### API Layer
- **Primary**: AWS AppSync GraphQL API for core domain operations
- **Secondary**: API Gateway HTTP API for REST endpoints (auth, webhooks)
- **Authentication**: Lambda authorizer for unified auth across APIs

### Compute Layer
- **AppSync Resolvers**: JavaScript VTL templates for simple select operations
- **Lambda Functions**: Python FastAPI services for complex business logic and update
- **Containerized**: Docker images for consistent Lambda deployment

### Data Layer
- **Primary Database**: DynamoDB single-table design
- **Search**: OpenSearch Serverless (optional, for advanced search)
- **Caching**: ElastiCache Redis (optional, for leaderboards/hot data)
- **Analytics**: S3 + Athena for data lake and BI

## AWS Services Used

### Core Services
- **AWS AppSync**: Managed GraphQL API with real-time subscriptions
- **AWS Lambda**: Serverless compute for business logic and update,delete,and insert operations
- **Amazon DynamoDB**: NoSQL database with single-table design
- **AWS Cognito**: User authentication and JWT token management
- **AWS API Gateway**: REST API endpoints and WebSocket support

### Supporting Services
- **Amazon ECR**: Container registry for Lambda images
- **AWS IAM**: Identity and access management
- **AWS Systems Manager (SSM)**: Parameter store for configuration
- **Amazon SES**: Email delivery service
- **Amazon EventBridge**: Event bus for domain events
- **Amazon SQS**: Message queues for async processing
- **Amazon SNS**: Push notifications and SMS
- **AWS CloudWatch**: Monitoring, logging, and alerting
- **AWS X-Ray**: Distributed tracing
- **AWS WAF**: Web application firewall

### Optional/Advanced Services
- **OpenSearch Serverless**: Full-text search and discovery
- **ElastiCache**: Redis for caching and leaderboards
- **AWS Step Functions**: Complex workflow orchestration
- **Amazon S3**: Data lake for analytics
- **AWS Glue/Athena**: Data processing and analytics

## Database Architecture

### DynamoDB Single-Table Design

**Table Name**: `gg_core`

**Primary Key**:
- Partition Key (PK): Entity identifier
- Sort Key (SK): Entity subtype/ordering

**Global Secondary Indexes (GSIs)**:
- **GSI1**: User-owned entity listings (`GSI1PK=USER#<userId>`, `GSI1SK=ENTITY#<type>#<timestamp>`)
- **GSI2**: Unique nickname lookups (`GSI2PK=NICK#<nickname>`, `GSI2SK=PROFILE#<userId>`)
- **GSI3**: Unique email lookups (`GSI3PK=EMAIL#<email>`, `GSI3SK=PROFILE#<userId>`)

### Entity Patterns

#### User Profile
```
PK: USER#<userId>
SK: PROFILE#<userId>
GSI1PK: USER#<userId>
GSI1SK: ENTITY#User#<createdAt>
GSI2PK: NICK#<nickname>
GSI2SK: PROFILE#<userId>
GSI3PK: EMAIL#<email>
GSI3SK: PROFILE#<userId>
```

#### Goal (User-owned)
```
PK: USER#<userId>
SK: GOAL#<goalId>
GSI1PK: USER#<userId>
GSI1SK: ENTITY#Goal#<createdAt>
```

#### Task (Goal-owned)
```
PK: USER#<userId>
SK: TASK#<taskId>
GSI1PK: USER#<userId>
GSI1SK: ENTITY#Task#<createdAt>
```

#### Quest (User-owned)
```
PK: USER#<userId>
SK: QUEST#<questId>
GSI1PK: USER#<userId>
GSI1SK: QUEST#<createdAt>
```

#### Email Uniqueness Lock
```
PK: EMAIL#<email>
SK: UNIQUE#USER
```

#### Nickname Uniqueness Lock
```
PK: NICK#<nickname>
SK: UNIQUE#USER
```

### Access Patterns
- Get user profile by ID
- List user's goals/tasks/quests
- Check email/nickname availability
- Query goals/tasks by status/tags
- User timeline views
- Real-time chat messages
- Gamification aggregates
- Quest completion tracking

## Backend Services Architecture

### Service Types

#### 1. AppSync GraphQL Resolvers (JavaScript VTL)
**Location**: `backend/infra/terraform/resolvers/`
**Purpose**: Simple CRUD operations and data fetching
**Examples**:
- `getGoals.js`: Query user goals with filtering
- `myGoals.js`: Get current user's goals
- `activeGoalsCount.js`: Count active goals
- `myQuests.js`: Query user quests (read-only)
- `sendMessage.js`: Create chat messages

#### 2. Lambda Microservices (Python FastAPI)
**Location**: `backend/services/`
**Containerized**: Docker images via ECR
**Services**:
- **User Service**: Authentication, user management, profiles
- **Quest Service**: Goals, tasks, quests, AI features
- **Authorizer Service**: JWT validation for API Gateway/AppSync

### Lambda Function Patterns

#### User Service (`backend/services/user-service/`)
- **Framework**: FastAPI with Pydantic models
- **Endpoints**:
  - `POST /users/signup`: User registration (local/Google OAuth)
  - `POST /users/login`: Local authentication
  - `GET /users/confirm-email`: Email confirmation
  - `GET /profile`: Get user profile
  - `PUT /profile`: Update user profile
  - `POST /password/change`: Password management
  - `POST /auth/renew`: Token renewal

#### Quest Service (`backend/services/quest-service/`)
- **Framework**: FastAPI with dependency injection
- **Endpoints**:
  - `GET /quests`: List user goals
  - `POST /quests`: Create goal
- `POST /quests/createTask`: Add task to goal
- `POST /quests/createQuest`: Create quest (linked/quantitative)
- `POST /quests/quests/{id}/cancel`: Cancel quest
- `DELETE /quests/quests/{id}`: Delete quest (admin-only)
- `POST /ai/inspiration-image`: Generate goal inspiration images
- `POST /ai/suggest-improvements`: AI goal improvement suggestions
- **Quest Operations**: 
  - Reads: AppSync GraphQL (`myQuests`)
  - Writes: API Gateway → Quest Service Lambda (`createQuest`, `cancelQuest`, `deleteQuest`)

#### Authorizer Service (`backend/services/authorizer-service/`)
- **Purpose**: Unified JWT validation across APIs
- **Supports**: Local JWT and Cognito JWT tokens
- **Integration**: API Gateway Lambda Authorizer and AppSync Lambda Auth

### Common Backend Patterns

#### Authentication Context
```python
class AuthContext(BaseModel):
    user_id: str
    claims: Dict
    provider: str
```

#### CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### DynamoDB Retry Logic
```python
def _ddb_call(fn, *, op: str, max_retries: int = 2, **kwargs):
    # Exponential backoff retry logic
```

#### Structured Logging
```python
logger = get_structured_logger("service-name")
log_event(logger, "event_name", **fields)
```

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (TanStack) for server state
- **GraphQL Client**: Apollo Client with AWS Amplify integration
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives via shadcn/ui

### Key Frontend Patterns

#### Apollo GraphQL Integration
```typescript
const client = new ApolloClient({
  link: createAuthLink().concat(httpLink),
  cache: new InMemoryCache(),
});
```

#### AWS Amplify Configuration
```typescript
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: appsyncUrl,
      region: awsRegion,
      defaultAuthMode: 'lambda',
      apiKey: appsyncApiKey,
    },
  },
});
```

#### Authentication Flow
- **Login**: Local email/password or Google OAuth
- **Token Management**: Automatic renewal with `authFetch`
- **Session Handling**: JWT storage with refresh logic

#### Component Architecture
- **Pages**: Route-based components in `src/pages/`
- **Components**: Reusable UI in `src/components/`
- **Hooks**: Custom logic in `src/hooks/`
- **Lib**: Utilities and configurations in `src/lib/`
- **Models**: TypeScript interfaces and type definitions in `src/models/`
- **i18n**: Translation files for internationalization in `src/i18n/`

#### Form Validation
```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

#### API Service Separation
- **Dedicated API Files**: API integration logic must be in separate service files in `src/lib/`
- **Pattern**: `src/lib/api[Feature].ts` (e.g., `apiProfile.ts`, `apiGoal.ts`, `apiTask.ts`, `apiQuest.ts`)
- **Purpose**: Separation of concerns, improved testability, and reusability
- **Functions**: CRUD operations, data transformation, error handling, and validation

```typescript
// Example: src/lib/apiProfile.ts
export async function getProfile(): Promise<UserProfile> {
  const response = await authFetch('/profile');
  return response.json();
}

export async function updateProfile(updates: ProfileUpdateInput): Promise<UserProfile> {
  const response = await authFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  return response.json();
}
```

#### Model Definitions
- **Location**: `src/models/` directory for TypeScript interfaces
- **Purpose**: Centralized type definitions and data contracts
- **Pattern**: Feature-specific model files (e.g., `profile.ts`, `goal.ts`, `quest.ts`)
- **Contents**: Interface definitions, type guards, and data transformation utilities

```typescript
// Example: src/models/profile.ts
export interface ProfileFormData {
  fullName?: string;
  nickname?: string;
  birthDate?: string;
  country?: string;
  language: string;
  gender?: string;
  pronouns?: string;
  bio?: string;
  tags: string[];
}

export interface ProfileValidationErrors {
  fullName?: string;
  nickname?: string;
  birthDate?: string;
  country?: string;
  // ... other field errors
}
```

#### i18n Translation Pattern
- **Structure**: Each feature/page has its own translation file in `src/i18n/`
- **Languages**: Support for English (en), Spanish (es), and French (fr)
- **Pattern**: TypeScript interfaces with nested object structure
- **Integration**: Use `useTranslation` hook for accessing translations

```typescript
// Example: src/i18n/profile.ts
export interface ProfileTranslations {
  title: string;
  basicInfo: {
    title: string;
    fullName: { label: string; placeholder: string };
    nickname: { label: string; placeholder: string; help: string };
  };
  validation: {
    required: string;
    nicknameTaken: string;
  };
}

export const profileTranslations: Record<Language, ProfileTranslations> = {
  en: { /* English translations */ },
  es: { /* Spanish translations */ },
  fr: { /* French translations */ },
};

// Usage in component:
const { t } = useTranslation();
return <h1>{t.profile.title}</h1>;
```

## Security Patterns

### Authentication Methods

#### 1. JWT Token Types
- **Local JWT**: Issued by user service for email/password auth
- **Cognito JWT**: For Google OAuth users
- **API Key**: Limited to public queries (email/nickname availability)

#### 2. Lambda Authorizer
- **Unified Auth**: Single authorizer for API Gateway and AppSync
- **Token Validation**: Supports both local and Cognito JWTs
- **Context Injection**: User ID and claims passed to services

### Authorization Patterns

#### Public Endpoints (API Key Only)
- `isEmailAvailable(email: String!)`
- `isNicknameAvailable(nickname: String!)`

#### Protected Operations (User Authentication Required)
- All GraphQL mutations and queries except public ones
- User profile CRUD operations
- Goal and task management
- Real-time chat operations

### Data Isolation
- **Partition Key Security**: All user data queries filter by `USER#<userId>`
- **Identity Verification**: Resolvers validate `ctx.identity.sub` matches requested user ID
- **Input Validation**: Pydantic models prevent malicious input

### Security Headers and Hardening
- **CORS**: Explicit allowlist with credentials support
- **HTTPS Only**: All communications encrypted
- **Token Expiry**: Short-lived tokens (20 minutes) with renewal
- **Password Security**: bcrypt hashing with strength validation
- **Rate Limiting**: Login attempt tracking and blocking

### Operational Security
- **IAM Least Privilege**: Minimal permissions per service
- **Secrets Management**: SSM Parameter Store for configuration
- **Audit Logging**: Structured logs for security events
- **DynamoDB Encryption**: Server-side encryption enabled

## Libraries and Dependencies

### Backend Dependencies

#### Python Services
```txt
# Core Framework
fastapi==0.115.0
uvicorn

# AWS Integration
boto3==1.34.162
botocore==1.34.162

# Authentication & Security
PyJWT==2.9.0
python-jose[cryptography]
bcrypt<4.1.0
passlib>=1.7.4

# Data Validation
pydantic==2.8.2
email_validator
python-multipart

# Utilities
requests==2.32.3

# Testing
pytest
pytest-cov
httpx
moto
```

#### Node.js (AppSync Resolvers)
```json
{
  "dependencies": {
    "@aws-appsync/utils": "^1.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0"
  }
}
```

### Frontend Dependencies
```json
{
  "dependencies": {
    // React Core
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",

    // GraphQL
    "@apollo/client": "^4.0.4",
    "graphql": "16.11.0",

    // AWS Integration
    "aws-amplify": "^6.15.6",
    "@aws-sdk/client-dynamodb": "^3.879.0",
    "@aws-sdk/client-ssm": "^3.879.0",

    // State Management
    "@tanstack/react-query": "^5.83.0",

    // Forms & Validation
    "react-hook-form": "^7.61.1",
    "@hookform/resolvers": "^3.10.0",
    "zod": "^4.1.4",

    // UI Components
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "lucide-react": "^0.462.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",

    // Utilities
    "date-fns": "^3.6.0",
    "jsonwebtoken": "^9.0.2"
  },

  "devDependencies": {
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@types/node": "^22.16.5",
    "@typescript-eslint/eslint-plugin": "^8.38.0",
    "@vitejs/plugin-react": "^5.0.3",
    "typescript": "^5.8.3",
    "vite": "^5.4.19",
    "vitest": "^2.0.5",
    "tailwindcss": "^3.4.17"
  }
}
```

## Infrastructure as Code

### Terraform Structure
```
backend/infra/terraform/
├── main.tf                 # Main infrastructure configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── providers.tf            # AWS provider configuration
├── environments/           # Environment-specific variables
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
├── modules/                # Reusable Terraform modules
│   ├── appsync_api/       # AppSync GraphQL API
│   ├── dynamodb/          # DynamoDB tables
│   ├── dynamodb_single_table/  # Core single-table
│   ├── lambda/            # Lambda functions
│   ├── lambda_zip/        # ZIP-based Lambda functions
│   ├── docker_lambda_image/   # Container Lambda functions
│   ├── network/           # API Gateway, Cognito, etc.
│   ├── iam/               # IAM roles and policies
│   └── ssm/               # Parameter store
├── resolvers/             # AppSync GraphQL resolvers
├── lambdas/               # Additional Lambda functions
└── scripts/               # Deployment and utility scripts
```

### Key Terraform Patterns

#### Module Organization
- **Separation of Concerns**: Each AWS service has its own module
- **Environment Configuration**: Per-environment variable files
- **Reusable Modules**: Common patterns extracted into modules

#### Lambda Deployment
- **Container Images**: ECR-hosted Docker images for Python services
- **Environment Variables**: Configuration via SSM Parameter Store
- **IAM Roles**: Least-privilege access per function

#### Security Configuration
- **Cognito User Pool**: User authentication setup
- **API Gateway**: REST API with Lambda authorizer
- **AppSync**: GraphQL API with Lambda auth and API key

## Development Patterns

### Code Organization
```
backend/services/
├── common/                 # Shared utilities and logging
├── user-service/          # User management microservice
│   ├── app/               # FastAPI application
│   ├── Dockerfile         # Container definition
│   ├── requirements.txt   # Python dependencies
│   └── tests/             # Unit tests
├── quest-service/         # Goal/task microservice
└── authorizer-service/    # Authentication service

frontend/src/
├── components/            # Reusable UI components
├── pages/                 # Page components
│   └── profile/           # Feature-specific pages
│       ├── ProfileView.tsx    # Profile display component
│       ├── ProfileEdit.tsx    # Profile edit component
│       └── __tests__/         # Component tests
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── apiProfile.ts      # Profile API service functions
│   ├── apiGoal.ts         # Goal API service functions
│   ├── apiTask.ts         # Task API service functions
│   ├── apiQuest.ts        # Quest API service functions
│   └── validation/        # Validation schemas
│       └── profileValidation.ts
├── models/                # TypeScript type definitions
│   ├── profile.ts         # Profile-related interfaces
│   └── quest.ts           # Quest-related interfaces
├── i18n/                  # Internationalization files
│   ├── profile.ts         # Profile page translations
│   ├── dashboard.ts       # Dashboard translations
│   ├── translations.ts    # Combined translations
│   └── common.ts          # Shared/common translations
├── config/                # AWS and app configuration
├── graphql/               # GraphQL queries/mutations
└── __tests__/             # Global test utilities
```

### Development Workflow
1. **Local Development**: Use `npm run dev` and local Lambda emulators
2. **Testing**: Vitest for frontend, pytest for backend
3. **Code Quality**: ESLint, Prettier, and Python type hints
4. **CI/CD**: Automated testing and deployment via GitHub Actions

### Feature Development Guidelines
When implementing new features, follow these architectural patterns:

#### API Integration
- **Always create dedicated API service files** in `src/lib/api[Feature].ts`
- **Never put API calls directly in components** - use service functions instead
- **Include error handling and data transformation** in service functions
- **Test API services separately** from UI components

#### Type Definitions
- **Create model files** in `src/models/` for complex feature interfaces
- **Use descriptive interface names** that clearly indicate their purpose
- **Include validation error types** alongside data interfaces
- **Import models** in components and API services as needed

#### Internationalization
- **Create dedicated translation files** in `src/i18n/` for each major feature
- **Support all three languages**: English, Spanish, and French
- **Use nested object structures** for organizing translations by feature sections
- **Integrate translations** using the `useTranslation` hook in components

#### Validation
- **Create feature-specific validation schemas** in `src/lib/validation/`
- **Use Zod schemas** for runtime type validation and error messages
- **Include business logic validation** (date ranges, format checks, etc.)
- **Test validation schemas** separately from components

### Dependency Management
- **Python**: UV for dependency installation (Python 3.12 required)
- **Node.js**: npm/pnpm for frontend dependencies
- **Terraform**: Version pinning for infrastructure dependencies

## Deployment Patterns

### Environment Strategy
- **Development**: Full infrastructure with API keys enabled
- **Staging**: Production-like environment for testing
- **Production**: Optimized for security and performance

### CI/CD Pipeline
1. **Build**: Compile frontend, build Lambda containers
2. **Test**: Run unit and integration tests
3. **Deploy**: Terraform apply to target environment
4. **Verify**: Health checks and smoke tests

### Container Strategy
- **Base Images**: Python 3.12 slim images for Lambda
- **Multi-stage Builds**: Optimized for size and security
- **Layer Caching**: ECR for fast deployments

### Configuration Management
- **SSM Parameters**: Environment-specific configuration
- **Environment Variables**: Runtime configuration injection
- **Secrets**: Secure credential storage

This architecture guide provides the foundation for replicating Questbound Forge's patterns. The serverless, cloud-agnostic design ensures scalability, maintainability, and portability across different cloud providers while leveraging AWS's managed services for operational efficiency.

# 11. Social & Communication Architecture (Hybrid)
## 11. Social & Communication Architecture (Hybrid)

### Overview
We implement a **hybrid social architecture** that is cost-efficient at MVP scale and linearly scalable as the graph grows:

- **Fan-in (query-on-demand)** for most users: write each Activity once, build timelines at read.
- **Selective fan-out (materialized feeds)** for power users/groups: Streams → SQS → Lambda writes per-follower `FeedItem` entries for fast reads.
- **Async Chat**: message items in room partitions; real-time delivery via AppSync subscriptions or short polling.
- **Lambda-backed mutations** for all write paths to centralize validation, idempotency, and side effects.

### Data Model Summary (DynamoDB single-table `gg_core`)
Key prefixes (PK/SK):
```
USER#<id>   GROUP#<id>  GOAL#<id>  ROOM#<id>  ACTIVITY#<actorId>  FEED#<userId>
```
- **Follow edges**: `PK=USER#<followerId>`, `SK=FOLLOWING#<followeeId>` with reverse lookup on GSI (`GSI1PK=USER#<followeeId>`, `GSI1SK=FOLLOWER#<followerId>`). Counters maintained by Streams.
- **Groups & membership**: `PK=GROUP#<groupId>` + `SK=MEMBER#<userId>`; reverse user→groups via GSI1. Flag `isPersistent` to “graduate” project rooms to communities.
- **Activities** (canonical): `PK=ACTIVITY#<actorId>`, `SK=TS#<ts>#<activityId>`.
- **FeedItems** (materialized, selective): `PK=FEED#<followerId>`, `SK=TS#<ts>#<activityId>` with `ttl` (30–60 days).
- **Chat**: `PK=ROOM#<roomId>`, `SK=MSG#<ts>#<messageId>`.

### API Layer (AppSync)
- **Auth**: Lambda authorizer (supports Cognito JWT + local tokens).
- **Queries** (mostly direct/resolver JS):
  - Profiles, goals/tasks, groups & members, chat history (`ROOM#`), and **timeline**.
  - Timeline resolver decides: if user has materialized `FEED#` then query it, else call a small aggregator Lambda to fan-in recent followees’ `ACTIVITY#` partitions and merge/sort.
- **Mutations** (Lambda-backed):
  - `followUser`, `unfollowUser` (edges + counters)
  - `createGroup`, `joinGroup`, `leaveGroup`
  - `createGoal`, `updateGoal`, `createTask`, `completeTask`
  - `postActivity` (write Activity; fan-out processor may materialize)
  - `sendMessage` (chat write)
- **Subscriptions**:
  - `onNewFeedItem(userId)`; `onMessage(roomId)`

### Eventing & Pipelines
- **DynamoDB Streams → SQS → Lambda**:
  - Batched fan-out (materialize FeedItems) for **promoted** actors/groups only.
  - Update denormalized counters (followers, group member counts).
  - Publish domain events to EventBridge (optional) for notifications or analytics sinks.
- **Promotion logic**:
  - Nightly job + on-threshold triggers set `fanoutEnabled=true` for users/groups above **followers** or **posts/day** thresholds.
  - Demote when inactive.

### Matching & Discovery (2.1.2)
- **MVP**: AI-generated tags persisted on profiles/goals; filter/sort with simple queries over recent timelines.
- **Scale-out option**: **OpenSearch Serverless** as a read-side index fed by Streams for full-text queries.

### Communication & Community (2.1.5)
- **Async chat** with AppSync subscriptions, room partitions, optional SNS push.
- **Hybrid groups** evolve from single-goal project rooms to communities with multiple threads and pinned posts.

### Observability & Guardrails
- CloudWatch/X-Ray dashboards: AppSync p95, Lambda duration/error, DDB RCUs/WCUs & throttles, SQS backlog, DLQs.
- SLOs: Query p95 ≤ 200ms, Mutation p95 ≤ 300ms, Feed freshness ≤ 15s.
- Hot-key protection: shard reverse edges for very large follower sets if required (`USER#<id>#shardN`).

# 12. Rollout & SLOs
## 12. Rollout & SLOs

### Phased Delivery
1. **MVP**: users, goals/tasks, follow/unfollow, project rooms, async chat, **fan-in feed**, AI tagging.
2. **Engagement**: badges/XP hooks on activity, notifications, feed polish.
3. **Scale knobs**: Streams→SQS fan-out for promoted users/groups, counters & promotion cron, optional OpenSearch.
4. **Communities**: group graduation, pinned posts, moderation roles, forum threads.

### SLO Targets
- AppSync queries p95 ≤ 200ms; mutations p95 ≤ 300ms.
- Feed freshness ≤ 15 seconds (fan-in short-poll or fan-out replication).
- Error rate < 0.1%; DLQ empty within 5 minutes of backlog.

# 13. Cost Strategy (Startup-Friendly)
## 13. Cost Strategy (Startup-Friendly)

- **Default to fan-in**: minimal writes and infra; cheapest for ≤10k DAU.
- **Selective fan-out**: cap materialization to ~5–20% of active users/groups (promotion thresholds) to keep costs predictable.
- **TTL & caps**: expire FeedItems after 30–60 days; keep last 500–1,000 per user.
- **On-demand → provisioned**: start with on-demand; move hot partitions to provisioned+auto-scaling based on p95.
- **Media off-table**: store in S3; DynamoDB stores lightweight metadata only.
- **Feature flags**: enable/disable fan-out by cohort to A/B cost vs. latency.

For a quantitative comparison, see the separate cost curves (fan-in vs fan-out vs hybrid) and adjust promotion share as DAU grows.
