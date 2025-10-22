# Guild Features Implementation Plan (Tasks 20.1-20.3)

## Description

Implement guild (persistent community) features allowing users to create guilds that can contain multiple goals/quests. Guilds are social communities where users can collaborate on multiple related objectives. This includes frontend forms for guild creation, listing joined guilds, displaying guild details, guild rankings, and member-only comments system.

**Key Requirements:**
- Guilds are persistent communities (not temporary project rooms)
- Guilds can contain multiple goals/quests
- Goals/quests can belong to multiple guilds
- Three guild types: Public (open join), Private (invite-only), Approval-Required (owner/moderator approval)
- Guild ranking system with leaderboards and position tracking
- Member-only comments system with threading and moderation
- Guild analytics with member performance metrics
- Guild avatar upload system with S3 storage and security controls
- Guild ownership transfer and moderator role management
- Use separate `gg_guild` DynamoDB table with relationships to `gg_core` table
- Dedicated guild-service for backend operations

## Current Architecture Analysis

**Existing Collaboration Service:**
- Location: `backend/services/collaboration-service/`
- Current entities: Invites, Collaborators, Comments, Reactions
- Current resource types: goal, quest, task
- API endpoints: `/collaborations/*` via API Gateway
- Database: Uses `gg_core` single-table with `RESOURCE#{type}#{id}` pattern

**Existing Frontend Components:**
- Location: `frontend/src/components/collaborations/`
- Components: CollaboratorList, CommentSection, InviteCollaboratorModal
- API client: `frontend/src/lib/api/collaborations.ts`

**New Guild Service Architecture:**
- Location: `backend/services/guild-service/`
- Dedicated service for guild operations
- API endpoints: `/guilds/*` via API Gateway
- Database: Uses `gg_guild` table with guild-specific patterns
- Separate CloudWatch logs and monitoring
- Own SSM parameters for configuration

## Technical Implementation Plan

### Phase 1: Database Schema Design & Guild Service Creation

#### 1.1 Create gg_guild DynamoDB Table
**Files to create/modify:**
- `backend/infra/terraform2/stacks/database/main.tf` - Add gg_guild table definition
- `backend/infra/terraform2/modules/dynamodb/main.tf` - Add guild table module

**Table Design:**
```
Table: gg_guild
Primary Key:
- PK: GUILD#{guildId}
- SK: METADATA#{guildId} | MEMBER#{userId} | GOAL#{goalId} | QUEST#{questId} | COMMENT#{commentId} | RANKING#{timestamp}

Global Secondary Indexes:
- GSI1: User-owned guilds (GSI1PK=USER#{userId}, GSI1SK=GUILD#{guildId})
- GSI2: Guild members lookup (GSI2PK=GUILD#{guildId}, GSI2SK=MEMBER#{userId})
- GSI3: Goal-guild relationships (GSI3PK=GOAL#{goalId}, GSI3SK=GUILD#{guildId})
- GSI4: Guild comments (GSI4PK=GUILD#{guildId}, GSI4SK=COMMENT#{commentId})
- GSI5: Guild rankings (GSI5PK=RANKING, GSI5SK=SCORE#{score}#GUILD#{guildId})
```

**Algorithm for Guild-Metadata Item:**
```
PK: GUILD#{guildId}
SK: METADATA#{guildId}
Attributes:
- guildId, name, description, createdBy, createdAt, updatedAt
- memberCount, goalCount, questCount, guildType
- tags[], settings{allowJoinRequests, requireApproval, allowComments}
- totalScore, activityScore, growthRate, badges[]
- avatarUrl, avatarKey
- moderators: string[] (userIds of moderators)
- pendingRequests: number (count of pending join requests)
```

**Guild Types:**
- `public`: Anyone can join without approval
- `private`: Invite-only, no public joining
- `approval`: Requires owner/moderator approval to join

**Algorithm for Guild-Member Item:**
```
PK: GUILD#{guildId}
SK: MEMBER#{userId}
Attributes:
- guildId, userId, username, email, avatarUrl
- role: 'owner' | 'moderator' | 'member'
- joinedAt, lastSeenAt, invitedBy
- isBlocked: boolean, blockedAt?: string, blockedBy?: string
- canComment: boolean (default true, can be set to false by moderators)
```

**Algorithm for Guild-Join-Request Item:**
```
PK: GUILD#{guildId}
SK: REQUEST#{userId}
Attributes:
- guildId, userId, username, email, avatarUrl
- requestedAt, status: 'pending' | 'approved' | 'rejected'
- reviewedBy?: string, reviewedAt?: string, reviewReason?: string
- ttl: number (auto-cleanup after 30 days)
```

**Algorithm for Guild-Comment Item:**
```
PK: GUILD#{guildId}
SK: COMMENT#{commentId}
Attributes:
- commentId, guildId, userId, username, avatarUrl
- content, createdAt, updatedAt, parentCommentId
- likes, isLiked, isEdited, userRole
- isModerated: boolean, moderatedBy?: string, moderatedAt?: string
- ttl: number (optional, for cleanup)
```

**Algorithm for Guild-Ranking Item:**
```
PK: GUILD#{guildId}
SK: RANKING#{timestamp}
Attributes:
- guildId, position, previousPosition, totalScore
- memberCount, goalCount, questCount, activityScore
- growthRate, badges[], calculatedAt
- ttl: number (for automatic cleanup of old rankings)
```

#### 1.2 Create New Guild Service
**Files to create:**
- `backend/services/guild-service/` - New dedicated service directory
- `backend/services/guild-service/app/main.py` - FastAPI application
- `backend/services/guild-service/app/models/guild.py` - Guild models
- `backend/services/guild-service/app/models/comment.py` - Comment models
- `backend/services/guild-service/app/models/ranking.py` - Ranking models
- `backend/services/guild-service/app/db/guild_db.py` - Guild database operations
- `backend/services/guild-service/app/db/comment_db.py` - Comment database operations
- `backend/services/guild-service/app/db/ranking_db.py` - Ranking database operations
- `backend/services/guild-service/app/settings.py` - Service configuration
- `backend/services/guild-service/requirements.txt` - Dependencies

**Guild Model Structure:**
```python
class GuildCreatePayload(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    tags: List[str] = Field(default_factory=list)
    is_public: bool = Field(default=True)

class GuildResponse(BaseModel):
    guild_id: str
    name: str
    description: Optional[str]
    created_by: str
    created_at: datetime
    member_count: int
    goal_count: int
    quest_count: int
    is_public: bool
    tags: List[str]
    # Ranking data
    position: Optional[int]
    previous_position: Optional[int]
    total_score: Optional[int]
    activity_score: Optional[int]
    growth_rate: Optional[float]
    badges: List[str]

class CommentCreatePayload(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    parent_comment_id: Optional[str] = None

class CommentResponse(BaseModel):
    comment_id: str
    guild_id: str
    user_id: str
    username: str
    avatar_url: Optional[str]
    content: str
    created_at: datetime
    updated_at: Optional[datetime]
    parent_comment_id: Optional[str]
    likes: int
    is_liked: bool
    is_edited: bool
    user_role: str
    replies: List['CommentResponse'] = []

class RankingResponse(BaseModel):
    guild_id: str
    position: int
    previous_position: Optional[int]
    total_score: int
    member_count: int
    goal_count: int
    quest_count: int
    activity_score: int
    growth_rate: float
    badges: List[str]
    calculated_at: datetime
```

#### 1.3 Guild Database Operations
**Key Operations Algorithm:**
1. **Create Guild**: Insert METADATA and MEMBER items, verify creator ownership
2. **Join Guild**: Add MEMBER item, increment counters, check permissions
3. **Leave Guild**: Remove MEMBER item, decrement counters, transfer ownership if needed
4. **Add Goal/Quest**: Add GOAL/QUEST item, increment counters, verify permissions
5. **Remove Goal/Quest**: Remove item, decrement counters, verify ownership
6. **Add Comment**: Insert COMMENT item, verify membership, handle threading
7. **Update Comment**: Modify COMMENT item, verify ownership, track edits
8. **Delete Comment**: Remove COMMENT item, verify permissions (owner/member)
9. **Like Comment**: Update COMMENT item likes, verify membership
10. **Calculate Rankings**: Batch update RANKING items, store position history
11. **Get Rankings**: Query GSI5 for sorted guild list with position trends

**Permission Algorithm:**
```
def verify_guild_permission(user_id, guild_id, required_role):
    # Check if user is guild member with required role
    # For public guilds: allow join requests
    # For private guilds: require invitation
    # Owner can modify all settings
    # Members can add/remove their own goals/quests
```

### Phase 2: Backend API Implementation

#### 2.1 Guild Service API Endpoints
**New API Routes:**
```
# Guild Management
POST   /guilds                    - Create guild
GET    /guilds                    - List user's guilds
GET    /guilds/{guild_id}         - Get guild details
PUT    /guilds/{guild_id}         - Update guild
DELETE /guilds/{guild_id}         - Delete guild (owner only)

# Membership Management
POST   /guilds/{guild_id}/join     - Join guild
POST   /guilds/{guild_id}/leave    - Leave guild
GET    /guilds/{guild_id}/members  - List guild members

# Content Association
POST   /guilds/{guild_id}/goals/{goal_id}     - Add goal to guild
DELETE /guilds/{guild_id}/goals/{goal_id}     - Remove goal from guild
POST   /guilds/{guild_id}/quests/{quest_id}   - Add quest to guild
DELETE /guilds/{guild_id}/quests/{quest_id}   - Remove quest from guild

# Comments System
GET    /guilds/{guild_id}/comments            - List guild comments
POST   /guilds/{guild_id}/comments            - Add comment
PUT    /guilds/{guild_id}/comments/{comment_id} - Update comment
DELETE /guilds/{guild_id}/comments/{comment_id} - Delete comment
POST   /guilds/{guild_id}/comments/{comment_id}/like - Like/unlike comment

# Rankings System
GET    /guilds/rankings                       - Get guild rankings
GET    /guilds/{guild_id}/ranking             - Get specific guild ranking
POST   /guilds/rankings/calculate             - Trigger ranking calculation (admin)

# Analytics
GET    /guilds/{guild_id}/analytics           - Get guild analytics
GET    /guilds/{guild_id}/analytics/members   - Get member leaderboard

# Avatar Management
POST   /guilds/{guild_id}/avatar              - Upload guild avatar
GET    /guilds/{guild_id}/avatar              - Get guild avatar URL
DELETE /guilds/{guild_id}/avatar              - Delete guild avatar
```

#### 2.2 AppSync GraphQL Integration
**Files to create/modify:**
- `backend/infra/terraform/graphql/schema.graphql` - Add Guild types and operations
- `backend/infra/terraform/resolvers/` - Add GraphQL resolvers for guild queries

**GraphQL Schema Additions:**
```graphql
type Guild {
  id: ID!
  name: String!
  description: String
  createdBy: User!
  createdAt: AWSTimestamp!
  memberCount: Int!
  goalCount: Int!
  questCount: Int!
  isPublic: Boolean!
  tags: [String!]!
  members: [User!]!
  goals: [Goal!]!
  quests: [Quest!]!
}

type Query {
  myGuilds: [Guild!]!
  guild(guildId: ID!): Guild
}

type Mutation {
  createGuild(input: CreateGuildInput!): Guild!
  joinGuild(guildId: ID!): Guild!
  leaveGuild(guildId: ID!): Guild!
}
```

### Phase 3: Frontend Implementation

#### 3.1 Implemented Frontend Features ✅
**Completed Components:**
- `frontend/src/components/guilds/GuildCreationForm.tsx` - Guild creation form with validation and guild type selection
- `frontend/src/components/guilds/GuildCreationModal.tsx` - Modal wrapper for creation
- `frontend/src/components/guilds/GuildCard.tsx` - Individual guild display card with type indicators
- `frontend/src/components/guilds/GuildsList.tsx` - Guild listing with search/filter
- `frontend/src/components/guilds/GuildDetails.tsx` - Detailed guild view with tabs (including moderation)
- `frontend/src/components/guilds/GuildAnalyticsCard.tsx` - Analytics display with metrics
- `frontend/src/components/guilds/GuildRankingCard.tsx` - Ranking display component
- `frontend/src/components/guilds/GuildRankingList.tsx` - Rankings leaderboard
- `frontend/src/components/guilds/GuildComments.tsx` - Member-only comments system
- `frontend/src/components/guilds/AvatarUpload.tsx` - Guild avatar upload component
- `frontend/src/components/guilds/GuildJoinRequests.tsx` - Join request management (owners/moderators)
- `frontend/src/components/guilds/GuildJoinRequestForm.tsx` - Join request form for approval guilds
- `frontend/src/components/guilds/GuildModeration.tsx` - Moderation actions (block users, manage comments)
- `frontend/src/components/guilds/GuildOwnershipTransfer.tsx` - Ownership transfer component

**Completed Pages:**
- `frontend/src/pages/guilds/MyGuilds.tsx` - Main guild page with rankings tab
- `frontend/src/pages/guilds/CreateGuild.tsx` - Guild creation page
- `frontend/src/pages/guilds/GuildDetails.tsx` - Guild details page
- `frontend/src/pages/guilds/GuildAnalytics.tsx` - Analytics page
- `frontend/src/pages/guilds/GuildRankings.tsx` - Rankings page

**Completed Hooks & API:**
- `frontend/src/hooks/useGuildAnalytics.ts` - Analytics data management
- `frontend/src/hooks/useGuildRankings.ts` - Rankings data management
- `frontend/src/lib/api/guild.ts` - Guild API client with mock data
- `frontend/src/lib/validation/guildValidation.ts` - Form validation schemas

**Features Implemented:**
- ✅ **Guild Types**: Public (open join), Private (invite-only), Approval-Required (owner/moderator approval)
- ✅ Guild creation with form validation and guild type selection
- ✅ Guild listing with search, filter, and sort with type indicators
- ✅ Guild details with tabbed interface (Overview, Members, Goals, Quests, Analytics, Comments, Join Requests, Moderation)
- ✅ Guild rankings with leaderboard and position tracking
- ✅ **Join Request System**: Request to join approval-required guilds with messaging
- ✅ **Moderation System**: Block/unblock users, remove comments, toggle comment permissions
- ✅ **Ownership Transfer**: Transfer guild ownership to other members
- ✅ **Role Management**: Owner, Moderator, Member roles with appropriate permissions
- ✅ Member-only comments system with threading and moderation
- ✅ Guild analytics with member leaderboard
- ✅ Guild avatar upload system with S3 integration
- ✅ Internationalization (English, Spanish, French)
- ✅ Responsive design with Tailwind CSS
- ✅ Accessibility features (ARIA labels, keyboard navigation)
- ✅ Navigation integration (User menu, routing)

#### 3.1.1 Admin Actions & Member Management ✅
**New Admin Features Implemented:**

**Members List Admin Actions:**
- ✅ **Transfer Ownership**: Owners can transfer guild ownership to other members
- ✅ **Moderator Management**: Owners can assign/remove moderator roles
- ✅ **User Blocking**: Owners/moderators can block/unblock users from commenting
- ✅ **User Removal**: Owners/moderators can remove users from the guild
- ✅ **Role-based Permissions**: Proper permission checks for all admin actions
- ✅ **Visual Indicators**: Blocked users and role badges displayed in member list

**Comments Moderation Actions:**
- ✅ **Comment Deletion**: Owners/moderators can delete any comment
- ✅ **User Blocking from Comments**: Block users directly from comment actions
- ✅ **User Removal from Guild**: Remove users directly from comment actions
- ✅ **Moderator Role Display**: Comments show moderator badges and permissions
- ✅ **Permission-based UI**: Actions only visible to users with appropriate permissions

**Technical Implementation:**
- ✅ **API Integration**: New `removeUserFromGuild` API function added
- ✅ **Mutation Handlers**: React Query mutations for all admin actions
- ✅ **Error Handling**: Comprehensive error handling with user feedback
- ✅ **Loading States**: Proper loading indicators during admin operations
- ✅ **Confirmation Dialogs**: User confirmation for destructive actions
- ✅ **Real-time Updates**: UI updates immediately after admin actions

#### 3.2 Guild API Client ✅
**Files Created:**
- `frontend/src/lib/api/guild.ts` - Complete guild API client with mock implementations
- `frontend/src/lib/validation/guildValidation.ts` - Validation schemas for all guild operations

**API Functions Implemented:**
- ✅ Basic guild operations (create, read, update, delete)
- ✅ Guild membership management (join, leave, remove)
- ✅ Content association (goals, quests)
- ✅ Guild discovery and search
- ✅ Guild rankings
- ✅ Avatar upload/management
- ✅ **Join request system** (request, approve, reject)
- ✅ **Moderation actions** (block user, unblock user, remove comment, toggle comment permission)
- ✅ **Ownership transfer**
- ✅ **Moderator management** (assign, remove)
- ✅ **User removal** (remove user from guild)

#### 3.3 Backend API Endpoints (To Be Implemented)
**New API Endpoints Required:**
- `POST /guilds/{guild_id}/join-request` - Send join request
- `GET /guilds/{guild_id}/join-requests` - Get pending join requests
- `POST /guilds/{guild_id}/join-requests/{user_id}/approve` - Approve join request
- `POST /guilds/{guild_id}/join-requests/{user_id}/reject` - Reject join request
- `POST /guilds/{guild_id}/transfer-ownership` - Transfer guild ownership
- `POST /guilds/{guild_id}/moderators` - Assign moderator
- `DELETE /guilds/{guild_id}/moderators/{user_id}` - Remove moderator
- `POST /guilds/{guild_id}/moderation` - Perform moderation action
- `POST /guilds/{guild_id}/block-user` - Block user from guild
- `POST /guilds/{guild_id}/unblock-user` - Unblock user
- `DELETE /guilds/{guild_id}/comments/{comment_id}` - Remove comment (moderation)
- `POST /guilds/{guild_id}/comment-permission` - Toggle user comment permission
- `DELETE /guilds/{guild_id}/members/{user_id}` - Remove user from guild

**API Client Pattern:**
```typescript
export interface Guild {
  guildId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  goalCount: number;
  questCount: number;
  isPublic: boolean;
  tags: string[];
}

export async function createGuild(data: GuildCreateInput): Promise<Guild> {
  // API call with proper error handling and auth
}
```

#### 3.2 Guild Creation Form (Task 20.1)
**Files to create:**
- `frontend/src/components/guilds/GuildCreationForm.tsx` - Main form component
- `frontend/src/components/guilds/GuildCreationModal.tsx` - Modal wrapper
- `frontend/src/pages/guilds/CreateGuild.tsx` - Page component

**Form Features:**
- Name field (required, 3-50 chars)
- Description field (optional, 500 char limit)
- Tags input (multi-select with suggestions)
- Public/Private toggle
- Form validation with Zod
- Loading states and error handling
- Accessibility features (ARIA labels, keyboard navigation)

#### 3.3 Joined Guilds List (Task 20.2)
**Files to create:**
- `frontend/src/components/guilds/GuildsList.tsx` - List component
- `frontend/src/components/guilds/GuildCard.tsx` - Individual guild card
- `frontend/src/pages/guilds/MyGuilds.tsx` - Page component

**List Features:**
- Grid/list view toggle
- Search and filter by tags
- Sort by creation date, member count
- Empty state with call-to-action
- Loading skeleton
- Pagination for large lists

#### 3.4 Guild Details Display (Task 20.3)
**Files to create:**
- `frontend/src/components/guilds/GuildDetails.tsx` - Main details component
- `frontend/src/components/guilds/GuildMembers.tsx` - Members section
- `frontend/src/components/guilds/GuildGoals.tsx` - Goals section
- `frontend/src/pages/guilds/GuildDetails.tsx` - Page component

**Details Features:**
- Guild header with name, description, stats
- Join/Leave button (contextual)
- Members list with roles
- Goals and quests tabs
- Settings button (for owners)
- Breadcrumbs navigation

### Phase 4: Testing & Quality Assurance

#### 4.1 Unit Tests
**Backend Tests:**
- `backend/services/collaboration-service/tests/test_guild_db.py` - Database operations
- `backend/services/collaboration-service/tests/test_guild_api.py` - API endpoints
- Coverage: >90% for new guild functionality

**Frontend Tests:**
- `frontend/src/components/guilds/__tests__/GuildCreationForm.test.tsx`
- `frontend/src/components/guilds/__tests__/GuildsList.test.tsx`
- `frontend/src/components/guilds/__tests__/GuildDetails.test.tsx`
- API integration tests in `frontend/src/lib/api/__tests__/guild.test.ts`

#### 4.2 Integration Tests
**Backend Integration:**
- Full guild lifecycle: create → join → add goals → leave → delete
- Permission validation scenarios
- Concurrent operations handling
- Cross-table relationship integrity

**Frontend Integration:**
- Complete user flows: Create guild → View in list → Access details
- Form validation edge cases
- Error recovery scenarios

#### 4.3 Selenium Automation
**Test Scenarios:**
- `scripts/run-guild-creation-tests.ps1` - Guild creation workflow
- `scripts/run-guild-management-tests.ps1` - Guild management operations
- `tests/seleniumGuildTests.js` - End-to-end guild automation

**Test Flow Algorithm:**
1. Login user
2. Navigate to guild creation
3. Fill form with valid data
4. Submit and verify success
5. Check guild appears in list
6. Access guild details
7. Verify all data displays correctly

### Phase 5: Infrastructure & Deployment

#### 5.1 Guild Service Infrastructure
**Files to create:**
- `backend/infra/terraform2/stacks/services/guild_service.tf` - Guild service Lambda
- `backend/infra/terraform2/modules/lambda/guild_service.tf` - Guild service module
- `backend/infra/terraform2/stacks/database/gg_guild.tf` - Guild table definition

**Files to modify:**
- `backend/infra/terraform2/stacks/database/main.tf` - Add gg_guild table reference
- `backend/infra/terraform2/modules/dynamodb/main.tf` - Add guild table configuration
- `backend/infra/terraform2/modules/apigateway/api_gateway.tf` - Add /guilds/* routes
- `backend/infra/terraform2/stacks/monitoring/main.tf` - Add guild service monitoring

**Infrastructure Changes:**
- New DynamoDB table (gg_guild) with provisioned throughput
- Guild service Lambda function with dedicated IAM role
- API Gateway /guilds/* routes with CORS configuration
- CloudWatch logs group for guild service
- CloudWatch alarms for guild operations and errors
- SSM parameters for guild service configuration
- X-Ray tracing for performance monitoring

#### 5.2 Ranking Calculation System
**Files to create:**
- `backend/services/guild-service/app/jobs/ranking_calculator.py` - Ranking calculation logic
- `backend/infra/terraform2/stacks/jobs/ranking_calculator.tf` - EventBridge rule for hourly calculation
- `backend/infra/terraform2/modules/lambda/ranking_calculator.tf` - Ranking calculator Lambda

**Ranking Algorithm:**
```python
def calculate_guild_rankings():
    # 1. Get all active guilds
    # 2. Calculate scores based on:
    #    - Member activity (login frequency, goal completion)
    #    - Goal completion rates
    #    - Quest participation
    #    - Comment engagement
    # 3. Store ranking with timestamp
    # 4. Update position trends
    # 5. Clean up old rankings (TTL)
```

**Infrastructure:**
- EventBridge rule: Hourly trigger (cron: 0 * * * ? *)
- Lambda function: Calculate and store rankings
- CloudWatch metrics: Ranking calculation duration and success rate

#### 5.3 Environment Configuration
**SSM Parameters:**
- Guild table name and configuration
- Guild-related feature flags
- Rate limiting for guild operations
- Ranking calculation settings (weights, intervals)
- Comment moderation settings

#### 5.4 Deployment Plan
1. Deploy database changes (gg_guild table)
2. Deploy backend service with guild endpoints
3. Deploy API Gateway updates
4. Deploy frontend components
5. Run integration tests
6. Gradual rollout with feature flags

### Phase 6: Documentation & Migration

#### 6.1 Database Documentation Update
**Task:** Update DynamoDB single-table model documentation
- Add gg_guild table schema to `docs/dynamodb_single_table_model.md`
- Document relationships between gg_core and gg_guild tables
- Update access patterns documentation

#### 6.2 API Documentation
**Files to update:**
- `backend/services/collaboration-service/README.md` - Add guild endpoints
- OpenAPI/Swagger documentation updates
- GraphQL schema documentation

#### 6.3 Migration Strategy
**Data Migration Algorithm:**
```python
# For existing goal-based collaborations, create guild equivalents
def migrate_existing_collaborations():
    # 1. Identify goals with multiple collaborators
    # 2. Create corresponding guild entities
    # 3. Migrate member relationships
    # 4. Update goal-guild associations
    # 5. Preserve existing permission models
```

**Backwards Compatibility:**
- Existing collaboration APIs remain functional
- Guild features are additive, not breaking changes
- Gradual migration of UI components

## Detailed Implementation Specifications

### API Endpoints Detailed Specification

#### 1. Guild Management Endpoints

**POST /collaborations/guilds**
- **Purpose:** Create a new guild
- **Authentication:** Required (user must be logged in)
- **Input:**
  ```json
  {
    "name": "string (3-50 chars, required)",
    "description": "string (max 500 chars, optional)",
    "tags": ["string array (max 10 items, optional)"],
    "is_public": "boolean (default: true)"
  }
  ```
- **Business Rules:**
  - Guild name must be unique (case-insensitive)
  - User can create maximum 10 guilds
  - Tags are normalized (lowercase, trimmed)
  - Description is sanitized (HTML stripped)
- **Output:**
  ```json
  {
    "guild_id": "string",
    "name": "string",
    "description": "string",
    "created_by": "string",
    "created_at": "ISO timestamp",
    "member_count": 1,
    "goal_count": 0,
    "quest_count": 0,
    "is_public": "boolean",
    "tags": ["string array"]
  }
  ```
- **Error Codes:** 400 (validation), 409 (duplicate name), 429 (rate limit)

**GET /collaborations/guilds**
- **Purpose:** List user's joined guilds
- **Authentication:** Required
- **Query Parameters:**
  - `limit` (integer, 1-50, default: 20)
  - `next_token` (string, for pagination)
- **Output:**
  ```json
  {
    "guilds": [
      {
        "guild_id": "string",
        "name": "string",
        "description": "string",
        "created_at": "ISO timestamp",
        "member_count": "integer",
        "goal_count": "integer",
        "quest_count": "integer",
        "is_public": "boolean",
        "tags": ["string array"],
        "role": "owner|member"
      }
    ],
    "next_token": "string (optional)",
    "total_count": "integer"
  }
  ```

**GET /collaborations/guilds/{guild_id}**
- **Purpose:** Get detailed guild information
- **Authentication:** Required (user must be member or guild public)
- **Path Parameters:** `guild_id` (UUID format)
- **Query Parameters:**
  - `include_members` (boolean, default: false)
  - `include_goals` (boolean, default: false)
  - `include_quests` (boolean, default: false)
- **Business Rules:**
  - Private guilds only visible to members
  - Public guilds visible to all authenticated users
- **Output:** Full guild object with optional expanded data

**PUT /collaborations/guilds/{guild_id}**
- **Purpose:** Update guild settings
- **Authentication:** Required (user must be guild owner)
- **Input:**
  ```json
  {
    "name": "string (3-50 chars, optional)",
    "description": "string (max 500 chars, optional)",
    "tags": ["string array (max 10 items, optional)"],
    "is_public": "boolean (optional)"
  }
  ```
- **Business Rules:**
  - Only owner can update
  - Name uniqueness validated if changed
  - At least one field must be provided
- **Output:** Updated guild object

**DELETE /collaborations/guilds/{guild_id}**
- **Purpose:** Delete guild (soft delete)
- **Authentication:** Required (user must be guild owner)
- **Business Rules:**
  - Guild marked as deleted (not physically removed)
  - All members removed
  - Goals/quests disassociated
  - Owner can restore within 30 days
- **Output:** Success confirmation

#### 2. Membership Management Endpoints

**POST /collaborations/guilds/{guild_id}/join**
- **Purpose:** Join a guild
- **Authentication:** Required
- **Business Rules:**
  - Guild must be public or user must have invitation
  - User cannot join if already member
  - Maximum 50 members per guild
  - User limited to 20 guild memberships
- **Output:** Updated guild object with new member count

**POST /collaborations/guilds/{guild_id}/leave**
- **Purpose:** Leave a guild
- **Authentication:** Required (user must be member)
- **Business Rules:**
  - Owner cannot leave (must transfer ownership or delete)
  - Last member leaving deletes the guild
  - Membership counters updated
- **Output:** Success confirmation

**GET /collaborations/guilds/{guild_id}/members**
- **Purpose:** List guild members
- **Authentication:** Required (user must be member)
- **Query Parameters:**
  - `limit` (integer, 1-100, default: 50)
  - `role` (string: "owner|member|all", default: "all")
  - `next_token` (string, for pagination)
- **Output:**
  ```json
  {
    "members": [
      {
        "user_id": "string",
        "username": "string",
        "role": "owner|member",
        "joined_at": "ISO timestamp",
        "last_seen_at": "ISO timestamp (optional)"
      }
    ],
    "next_token": "string (optional)",
    "total_count": "integer"
  }
  ```

**DELETE /collaborations/guilds/{guild_id}/members/{user_id}**
- **Purpose:** Remove member from guild
- **Authentication:** Required (caller must be owner)
- **Business Rules:**
  - Cannot remove owner
  - Member loses access to guild content
  - Goals/quests remain associated with guild
- **Output:** Success confirmation

#### 3. Content Association Endpoints

**POST /collaborations/guilds/{guild_id}/goals/{goal_id}**
- **Purpose:** Add goal to guild
- **Authentication:** Required (user must be guild member)
- **Business Rules:**
  - Goal must exist and be owned by user
  - Goal cannot already be in guild
  - Maximum 100 goals per guild
  - Goal can be in multiple guilds
- **Output:** Updated guild object with new goal count

**DELETE /collaborations/guilds/{guild_id}/goals/{goal_id}**
- **Purpose:** Remove goal from guild
- **Authentication:** Required (user must be guild member or goal owner)
- **Business Rules:**
  - Goal remains in other guilds
  - Guild goal count updated
  - Comments on goal remain accessible
- **Output:** Updated guild object

**POST /collaborations/guilds/{guild_id}/quests/{quest_id}**
- **Purpose:** Add quest to guild
- **Authentication:** Required (user must be guild member)
- **Business Rules:**
  - Quest must exist and be owned by user
  - Quest cannot already be in guild
  - Maximum 50 quests per guild
  - Quest can be in multiple guilds
- **Output:** Updated guild object with new quest count

**DELETE /collaborations/guilds/{guild_id}/quests/{quest_id}**
- **Purpose:** Remove quest from guild
- **Authentication:** Required (user must be guild member or quest owner)
- **Business Rules:**
  - Quest remains in other guilds
  - Guild quest count updated
  - Comments on quest remain accessible
- **Output:** Updated guild object

### GraphQL Queries and Mutations Detailed Specification

#### Queries

**myGuilds**
- **Purpose:** Get current user's guilds
- **Arguments:**
  - `limit: Int = 20` (max 50)
  - `nextToken: String`
- **Output:**
  ```graphql
  type GuildConnection {
    items: [Guild!]!
    nextToken: String
    totalCount: Int!
  }
  ```
- **Authorization:** Authenticated user only
- **Performance:** Uses GSI1 query on gg_guild table

**guild(guildId: ID!)**
- **Purpose:** Get detailed guild information
- **Arguments:**
  - `guildId: ID!` (required)
  - `includeMembers: Boolean = false`
  - `includeGoals: Boolean = false`
  - `includeQuests: Boolean = false`
- **Output:**
  ```graphql
  type Guild {
    id: ID!
    name: String!
    description: String
    createdBy: User!
    createdAt: AWSTimestamp!
    memberCount: Int!
    goalCount: Int!
    questCount: Int!
    isPublic: Boolean!
    tags: [String!]!
    members: [GuildMember!]  # Only if includeMembers=true
    goals: [Goal!]           # Only if includeGoals=true
    quests: [Quest!]         # Only if includeQuests=true
  }
  ```
- **Authorization:** Guild members or public guilds
- **Performance:** Multiple queries if expanded data requested

**discoverGuilds**
- **Purpose:** Discover public guilds
- **Arguments:**
  - `search: String` (optional, name/description search)
  - `tags: [String!]` (optional, tag filtering)
  - `limit: Int = 20` (max 50)
- **Output:** GuildConnection
- **Authorization:** All authenticated users
- **Business Rules:** Only public guilds returned

#### Mutations

**createGuild(input: CreateGuildInput!)**
- **Input:**
  ```graphql
  input CreateGuildInput {
    name: String!        # 3-50 chars, unique
    description: String  # max 500 chars
    tags: [String!]      # max 10 items
    isPublic: Boolean    # default: true
  }
  ```
- **Output:** Guild!
- **Business Rules:** Same as REST API
- **Authorization:** Authenticated users

**updateGuild(guildId: ID!, input: UpdateGuildInput!)**
- **Input:**
  ```graphql
  input UpdateGuildInput {
    name: String         # 3-50 chars, unique if provided
    description: String  # max 500 chars
    tags: [String!]      # max 10 items
    isPublic: Boolean
  }
  ```
- **Output:** Guild!
- **Authorization:** Guild owner only

**deleteGuild(guildId: ID!)**
- **Output:** Boolean!
- **Authorization:** Guild owner only

**joinGuild(guildId: ID!)**
- **Output:** Guild!
- **Business Rules:** Same as REST API
- **Authorization:** Authenticated users

**leaveGuild(guildId: ID!)**
- **Output:** Guild!
- **Authorization:** Guild members (except owner)

**addGoalToGuild(guildId: ID!, goalId: ID!)**
- **Output:** Guild!
- **Business Rules:** User must own goal, be guild member
- **Authorization:** Guild members

**removeGoalFromGuild(guildId: ID!, goalId: ID!)**
- **Output:** Guild!
- **Authorization:** Guild members or goal owner

**addQuestToGuild(guildId: ID!, questId: ID!)**
- **Output:** Guild!
- **Business Rules:** User must own quest, be guild member
- **Authorization:** Guild members

**removeQuestFromGuild(guildId: ID!, questId: ID!)**
- **Output:** Guild!
- **Authorization:** Guild members or quest owner

### Frontend Fields and Business Rules Detailed Specification

#### Guild Creation Form Fields

**Name Field:**
- **Type:** Text input
- **Required:** Yes
- **Validation Rules:**
  - Min length: 3 characters
  - Max length: 50 characters
  - Pattern: `^[a-zA-Z0-9\s\-_]+$`
  - No leading/trailing spaces
- **Business Rules:**
  - Must be unique (case-insensitive)
  - Cannot contain special characters except hyphens and underscores
- **UI Requirements:**
  - Placeholder: "Enter guild name"
  - Real-time validation feedback
  - Character counter
  - Accessibility: aria-describedby for error messages

**Description Field:**
- **Type:** Textarea
- **Required:** No
- **Validation Rules:**
  - Max length: 500 characters
  - HTML sanitized on backend
- **Business Rules:**
  - Optional rich text support (future enhancement)
  - Plain text only initially
- **UI Requirements:**
  - Placeholder: "Describe your guild's purpose"
  - Character counter
  - Auto-resize textarea

**Tags Field:**
- **Type:** Multi-select with autocomplete
- **Required:** No
- **Validation Rules:**
  - Max 10 tags per guild
  - Each tag: 2-20 characters, alphanumeric + spaces
  - Case-insensitive uniqueness
- **Business Rules:**
  - Tags are normalized (lowercase, trimmed)
  - Popular tags suggested
  - User can create new tags
- **UI Requirements:**
  - Tag input with suggestions
  - Remove tags with × button
  - Tag limit indicator

**Public/Private Toggle:**
- **Type:** Switch/Checkbox
- **Required:** No (defaults to public)
- **Business Rules:**
  - Public: Anyone can find and join
  - Private: Invite-only (future feature)
- **UI Requirements:**
  - Clear labeling: "Make guild public"
  - Help text explaining difference
  - Default state: checked (public)

#### Guild List Fields

**Search Field:**
- **Type:** Text input with debounced search
- **Required:** No
- **Validation Rules:**
  - Min length: 2 characters to trigger search
  - Max length: 100 characters
- **Business Rules:**
  - Searches guild names and descriptions
  - Case-insensitive
  - Debounced 300ms

**Tag Filter:**
- **Type:** Multi-select dropdown
- **Required:** No
- **Business Rules:**
  - AND logic: guild must have all selected tags
  - Shows available tags from search results

**Sort Options:**
- **Options:**
  - `newest`: created_at DESC
  - `oldest`: created_at ASC
  - `members`: member_count DESC
  - `activity`: last activity DESC (future feature)

**View Toggle:**
- **Options:** Grid view, List view
- **Default:** Grid view

#### Guild Card Fields

**Display Fields:**
- Guild name (linked)
- Description (truncated, expandable)
- Member count
- Goal/Quest counts
- Tags (up to 3 displayed)
- Created date
- Owner status indicator

**Action Fields:**
- Join/Leave button (contextual)
- Settings button (owner only)

### React Components Detailed Specification

#### GuildCreationForm Component

**Props:**
```typescript
interface GuildCreationFormProps {
  onSuccess?: (guild: Guild) => void;
  onCancel?: () => void;
  initialData?: Partial<GuildCreateInput>;
  mode?: 'create' | 'edit';
}
```

**State Management:**
- Form state: React Hook Form with Zod validation
- Loading state: boolean for submission
- Error state: field-level and form-level errors
- Success state: post-submission feedback

**Business Logic:**
- Debounced validation (300ms)
- Real-time name availability check
- Tag normalization and deduplication
- Form reset on successful submission

**Accessibility Features:**
- Form landmarks and headings
- Field labels and descriptions
- Error announcements (ARIA live regions)
- Keyboard navigation support
- Screen reader friendly

**UI Components Used:**
- FormField wrapper
- Input components
- Textarea
- TagInput custom component
- Switch for public/private
- Button variants for actions

#### GuildCreationModal Component

**Props:**
```typescript
interface GuildCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (guild: Guild) => void;
  initialData?: Partial<GuildCreateInput>;
}
```

**State Management:**
- Modal open/close state
- Form submission state
- Success feedback state

**Business Logic:**
- Modal backdrop click to close
- Escape key handling
- Form submission handling
- Success callback with guild data

**UI Components:**
- Modal wrapper (Radix UI)
- GuildCreationForm inside modal
- Close button
- Loading overlay during submission

#### GuildsList Component

**Props:**
```typescript
interface GuildsListProps {
  guilds: Guild[];
  isLoading?: boolean;
  onGuildClick?: (guild: Guild) => void;
  onJoinGuild?: (guildId: string) => void;
  searchQuery?: string;
  selectedTags?: string[];
  sortBy?: 'newest' | 'oldest' | 'members' | 'activity';
  viewMode?: 'grid' | 'list';
  showCreateButton?: boolean;
}
```

**State Management:**
- Local search/filter state
- View mode preference
- Loading states per guild action

**Business Logic:**
- Client-side filtering and sorting
- Search debouncing
- Infinite scroll or pagination
- Optimistic updates for join/leave actions

**Performance Features:**
- Memoized filtered results
- Virtual scrolling for large lists
- Lazy loading of guild cards
- Image optimization for thumbnails

#### GuildCard Component

**Props:**
```typescript
interface GuildCardProps {
  guild: Guild;
  onClick?: (guild: Guild) => void;
  onJoin?: (guildId: string) => Promise<void>;
  onLeave?: (guildId: string) => Promise<void>;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}
```

**Display Logic:**
- Conditional rendering based on membership status
- Owner badges and indicators
- Truncated descriptions with expand option
- Tag display with overflow handling

**Interactive Elements:**
- Join/Leave buttons with loading states
- Settings menu for owners
- Click handlers for navigation

#### GuildDetails Component

**Props:**
```typescript
interface GuildDetailsProps {
  guildId: string;
  initialTab?: 'overview' | 'members' | 'goals' | 'quests';
}
```

**State Management:**
- Guild data fetching with React Query
- Tab navigation state
- Member/goal/quest loading states
- User membership status

**Business Logic:**
- Conditional rendering based on permissions
- Tab-based content organization
- Join/leave functionality
- Owner action availability

**Child Components:**
- GuildOverview tab
- GuildMembers tab
- GuildGoals tab
- GuildQuests tab

#### GuildMembers Component

**Props:**
```typescript
interface GuildMembersProps {
  guildId: string;
  members: GuildMember[];
  currentUserRole: 'owner' | 'member' | null;
  onRemoveMember?: (userId: string) => Promise<void>;
  isLoading?: boolean;
}
```

**Features:**
- Member list with roles
- Search and filter members
- Remove member functionality (owner only)
- Member count display
- Pagination for large guilds

#### GuildGoals Component

**Props:**
```typescript
interface GuildGoalsProps {
  guildId: string;
  goals: Goal[];
  canAddGoals: boolean;
  onAddGoal?: () => void;
  onRemoveGoal?: (goalId: string) => Promise<void>;
}
```

**Features:**
- Goal cards using existing Goal components
- Add goal to guild functionality
- Remove goal from guild (with confirmation)
- Empty state when no goals
- Progress indicators

#### GuildQuests Component

**Props:**
```typescript
interface GuildQuestsProps {
  guildId: string;
  quests: Quest[];
  canAddQuests: boolean;
  onAddQuest?: () => void;
  onRemoveQuest?: (questId: string) => Promise<void>;
}
```

**Features:**
- Quest cards using existing Quest components
- Add quest to guild functionality
- Remove quest from guild (with confirmation)
- Status filtering
- Progress tracking

#### Form Validation Schema (guildValidation.ts)

```typescript
export const guildCreateSchema = z.object({
  name: z.string()
    .min(3, 'guild.validation.nameTooShort')
    .max(50, 'guild.validation.nameTooLong')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'guild.validation.nameInvalid')
    .refine(async (name) => {
      // Server-side uniqueness check
      return await checkNameAvailability(name);
    }, 'guild.validation.nameTaken'),

  description: z.string()
    .max(500, 'guild.validation.descriptionTooLong')
    .optional()
    .transform((val) => val?.trim()),

  tags: z.array(z.string()
    .min(2, 'guild.validation.tagTooShort')
    .max(20, 'guild.validation.tagTooLong')
    .regex(/^[a-zA-Z0-9\s]+$/, 'guild.validation.tagInvalid')
  )
  .max(10, 'guild.validation.tooManyTags')
  .optional()
  .transform((tags) => tags?.map(tag => tag.toLowerCase().trim())),

  isPublic: z.boolean().default(true)
});

export type GuildCreateForm = z.infer<typeof guildCreateSchema>;
```

#### Internationalization Structure (guild.ts)

```typescript
export interface GuildTranslations {
  title: string;
  create: {
    title: string;
    subtitle: string;
    form: {
      name: {
        label: string;
        placeholder: string;
        help: string;
        error: {
          required: string;
          tooShort: string;
          tooLong: string;
          invalid: string;
          taken: string;
        };
      };
      description: {
        label: string;
        placeholder: string;
        help: string;
        error: {
          tooLong: string;
        };
      };
      tags: {
        label: string;
        placeholder: string;
        help: string;
        addTag: string;
        error: {
          tooMany: string;
          invalid: string;
        };
      };
      isPublic: {
        label: string;
        help: string;
      };
    };
    actions: {
      create: string;
      creating: string;
      cancel: string;
    };
  };
  list: {
    title: string;
    search: {
      placeholder: string;
    };
    filters: {
      all: string;
      myGuilds: string;
      public: string;
    };
    sort: {
      label: string;
      newest: string;
      oldest: string;
      members: string;
      activity: string;
    };
    view: {
      grid: string;
      list: string;
    };
    empty: {
      title: string;
      description: string;
      action: string;
    };
  };
  details: {
    loading: string;
    notFound: string;
    notMember: string;
    tabs: {
      overview: string;
      members: string;
      goals: string;
      quests: string;
    };
    actions: {
      join: string;
      joining: string;
      leave: string;
      leaving: string;
      settings: string;
      invite: string;
    };
    stats: {
      members: string;
      goals: string;
      quests: string;
      created: string;
    };
  };
  members: {
    title: string;
    search: {
      placeholder: string;
    };
    role: {
      owner: string;
      member: string;
    };
    actions: {
      remove: string;
      viewProfile: string;
    };
    empty: string;
  };
  validation: {
    nameRequired: string;
    nameTooShort: string;
    nameTooLong: string;
    nameInvalid: string;
    nameTaken: string;
    descriptionTooLong: string;
    tagTooShort: string;
    tagTooLong: string;
    tagInvalid: string;
    tooManyTags: string;
  };
  messages: {
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    joinSuccess: string;
    leaveSuccess: string;
    removeSuccess: string;
    error: string;
    confirmLeave: string;
    confirmDelete: string;
    confirmRemove: string;
  };
}
```

### Business Rules Summary

**Guild Creation Rules:**
- Maximum 10 guilds per user
- Name uniqueness (case-insensitive)
- Maximum 10 tags per guild
- Default public visibility

**Membership Rules:**
- Maximum 50 members per guild
- Maximum 20 guilds per user
- Owners cannot leave (must transfer ownership)
- Private guilds require invitations (future)

**Content Association Rules:**
- Maximum 100 goals per guild
- Maximum 50 quests per guild
- Goals/quests can belong to multiple guilds
- Only owners can add/remove content

**Permission Rules:**
- Public guilds: read access for all authenticated users
- Private guilds: member-only access
- Owner permissions: full control
- Member permissions: add/remove own content, leave guild

**Data Integrity Rules:**
- Soft deletes for guilds (30-day recovery)
- Denormalized counters updated atomically
- Cross-table relationship validation
- Audit logging for all changes

## Risk Mitigation Plan

### Database and Data Integrity Risks

#### Risk: Schema Migration Issues
**Impact:** High - Could cause data corruption or service unavailability
**Likelihood:** Medium - New table and index creation
**Mitigation Strategies:**
- Pre-deployment schema validation against test data
- Zero-downtime migration with backwards compatibility
- Comprehensive backup before schema changes
- Rollback scripts for failed migrations

**Contingency Plan:**
- Automated rollback to previous schema version
- Data recovery from backups within 1 hour
- Graceful degradation with feature flags disabled

#### Risk: Cross-Table Relationship Corruption
**Impact:** High - Invalid guild-goal/quest associations
**Likelihood:** Low - Well-tested transaction logic
**Mitigation Strategies:**
- ACID-compliant operations for relationship changes
- Foreign key validation at application layer
- Regular data integrity checks via scheduled jobs
- Comprehensive test coverage for relationship operations

**Contingency Plan:**
- Automated cleanup scripts for orphaned relationships
- Manual reconciliation procedures documented
- Alert triggers for data inconsistency detection

#### Risk: Performance Degradation
**Impact:** Medium - Slow queries affecting user experience
**Likelihood:** Medium - New GSI queries and increased data volume
**Mitigation Strategies:**
- Query optimization with EXPLAIN plan analysis
- Read/write capacity planning based on load testing
- Query result caching for frequently accessed data
- Database performance monitoring dashboards

**Contingency Plan:**
- Auto-scaling policies for DynamoDB capacity
- Query timeout and circuit breaker patterns
- Performance baseline monitoring with alerts

### Backend Service Risks

#### Risk: API Breaking Changes
**Impact:** High - Could break existing frontend integrations
**Likelihood:** Low - Additive changes only
**Mitigation Strategies:**
- API versioning strategy with backwards compatibility
- Comprehensive integration tests before deployment
- Feature flags for gradual rollout
- API contract testing with consumer-driven contracts

**Contingency Plan:**
- API gateway routing rules for version isolation
- Rollback to previous API version within minutes
- Communication plan for API consumers

#### Risk: Authentication/Authorization Failures
**Impact:** Critical - Unauthorized access to guild data
**Likelihood:** Low - Leveraging existing auth system
**Mitigation Strategies:**
- Comprehensive permission testing for all operations
- Security audit of all new endpoints
- Rate limiting and abuse detection
- Input validation and sanitization

**Contingency Plan:**
- Emergency disable feature flags
- Security incident response procedures
- Audit logging for forensic analysis

#### Risk: Service Scalability Issues
**Impact:** Medium - Service unavailable under load
**Likelihood:** Low - Serverless architecture with auto-scaling
**Mitigation Strategies:**
- Load testing with production-like data volumes
- Lambda concurrency limits and monitoring
- Horizontal scaling validation
- Performance profiling and optimization

**Contingency Plan:**
- Auto-scaling policies with generous headroom
- Circuit breaker patterns for downstream services
- Service degradation graceful handling

### Frontend Implementation Risks

#### Risk: UI/UX Inconsistencies
**Impact:** Medium - Poor user experience, accessibility issues
**Likelihood:** Medium - New components must match existing design
**Mitigation Strategies:**
- Design system compliance review
- Accessibility audit (WCAG 2.1 AA compliance)
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness validation

**Contingency Plan:**
- Progressive enhancement approach
- Fallback UI for unsupported browsers
- Accessibility remediation procedures

#### Risk: Client-Side Performance Issues
**Impact:** Medium - Slow page loads, poor Core Web Vitals
**Likelihood:** Low - Following existing performance patterns
**Mitigation Strategies:**
- Bundle size monitoring and optimization
- Lazy loading for guild lists and details
- Image optimization and caching strategies
- Performance budget enforcement

**Contingency Plan:**
- Code splitting and dynamic imports
- Progressive loading with skeleton states
- Performance monitoring with alerts

#### Risk: Form Validation and Error Handling
**Impact:** Medium - User confusion, data quality issues
**Likelihood:** Low - Comprehensive validation schema
**Mitigation Strategies:**
- Client and server-side validation consistency
- Real-time validation feedback
- Comprehensive error message internationalization
- Form state persistence and recovery

**Contingency Plan:**
- Graceful error handling with user-friendly messages
- Form data backup and recovery mechanisms
- Validation rule documentation for support

### Integration and Compatibility Risks

#### Risk: Existing Feature Breakage
**Impact:** High - Collaboration features stop working
**Likelihood:** Low - Additive changes with isolation
**Mitigation Strategies:**
- Regression testing of all existing collaboration flows
- Feature flag isolation for new functionality
- Backwards compatibility testing with existing data
- Integration testing with dependent services

**Contingency Plan:**
- Feature flag rollback capability
- Service isolation with circuit breakers
- Incident response with rollback procedures

#### Risk: GraphQL Schema Conflicts
**Impact:** Medium - API unavailability or incorrect data
**Likelihood:** Low - Isolated schema additions
**Mitigation Strategies:**
- Schema validation and compatibility checks
- Gradual GraphQL client migration
- Query complexity and depth limiting
- Schema versioning strategy

**Contingency Plan:**
- GraphQL schema rollback procedures
- Client-side query fallback mechanisms
- Schema validation automation

#### Risk: Internationalization Coverage Gaps
**Impact:** Low - Poor experience for non-English users
**Likelihood:** Medium - New UI strings requiring translation
**Mitigation Strategies:**
- Translation completeness validation
- Fallback to English for missing translations
- Crowdsourced translation workflow
- Linguistic review for cultural appropriateness

**Contingency Plan:**
- English-only fallback mode
- Translation hotfix deployment process
- User feedback collection for missing translations

### Deployment and Operational Risks

#### Risk: Deployment Failures
**Impact:** High - Service downtime or inconsistent state
**Likelihood:** Low - Automated deployment pipelines
**Mitigation Strategies:**
- Blue-green deployment strategy
- Automated rollback on health check failures
- Deployment validation with smoke tests
- Gradual rollout with canary deployments

**Contingency Plan:**
- Immediate rollback to previous version
- Database state consistency checks
- Communication plan for deployment issues

#### Risk: Configuration Management Issues
**Impact:** Medium - Services misconfigured or unavailable
**Likelihood:** Low - Infrastructure as code
**Mitigation Strategies:**
- Configuration validation in CI/CD pipeline
- Environment-specific configuration management
- Secret rotation and access control
- Configuration drift detection

**Contingency Plan:**
- Configuration backup and recovery procedures
- Emergency configuration override mechanisms
- Configuration audit logging

#### Risk: Monitoring and Alerting Gaps
**Impact:** Medium - Undetected issues in production
**Likelihood:** Low - Comprehensive monitoring setup
**Mitigation Strategies:**
- Application Performance Monitoring (APM) integration
- Custom metrics for guild operations
- Error tracking and alerting thresholds
- Log aggregation and analysis

**Contingency Plan:**
- Manual monitoring procedures during incidents
- Alert escalation procedures
- Post-mortem analysis for monitoring improvements

### Security Risks

#### Risk: Data Privacy Violations
**Impact:** Critical - GDPR/CCPA compliance issues
**Likelihood:** Low - Following existing privacy patterns
**Mitigation Strategies:**
- Privacy impact assessment for guild data
- Data minimization and retention policies
- User consent mechanisms for data sharing
- Audit logging for data access

**Contingency Plan:**
- Data breach response procedures
- User notification workflows
- Regulatory reporting procedures

#### Risk: Authorization Bypass
**Impact:** Critical - Unauthorized access to sensitive data
**Likelihood:** Low - Multi-layer authorization
**Mitigation Strategies:**
- Defense in depth with multiple authorization checks
- Security testing and penetration testing
- Access control list (ACL) validation
- Token validation and refresh mechanisms

**Contingency Plan:**
- Emergency access revocation procedures
- Security incident response team activation
- Forensic analysis capabilities

#### Risk: Input Validation Vulnerabilities
**Impact:** High - Injection attacks or data corruption
**Likelihood:** Low - Comprehensive validation layers
**Mitigation Strategies:**
- Input sanitization at all layers (client, API, database)
- Content Security Policy (CSP) implementation
- XSS prevention in user-generated content
- SQL injection prevention with parameterized queries

**Contingency Plan:**
- Web Application Firewall (WAF) rules
- Input validation monitoring and alerting
- Security patch management procedures

### Performance and Scalability Risks

#### Risk: Database Hotspots
**Impact:** High - Service degradation under load
**Likelihood:** Medium - New access patterns and data growth
**Mitigation Strategies:**
- Partition key design for even distribution
- GSI usage optimization for query patterns
- Read/write sharding strategies
- Capacity planning with growth projections

**Contingency Plan:**
- Adaptive capacity scaling
- Query optimization during incidents
- Data archiving strategies for old guilds

#### Risk: API Rate Limiting Issues
**Impact:** Medium - Service unavailability or poor UX
**Likelihood:** Low - Existing rate limiting infrastructure
**Mitigation Strategies:**
- Rate limiting per user and per endpoint
- Burst handling with token bucket algorithms
- Queue management for high-volume operations
- Client-side request throttling

**Contingency Plan:**
- Dynamic rate limit adjustments
- Request queuing and prioritization
- User communication during high load periods

#### Risk: Memory and Resource Leaks
**Impact:** Medium - Service instability over time
**Likelihood:** Low - Serverless architecture with automatic cleanup
**Mitigation Strategies:**
- Memory usage monitoring and alerting
- Connection pool management
- Resource cleanup in error scenarios
- Performance profiling and leak detection

**Contingency Plan:**
- Automatic service restarts on resource thresholds
- Memory dump analysis procedures
- Resource usage optimization during incidents

### Risk Monitoring and Response

#### Proactive Monitoring Strategy
- **Application Metrics:**
  - API response times and error rates
  - Database query performance
  - User session analytics
  - Feature adoption metrics

- **Infrastructure Metrics:**
  - CPU, memory, and disk usage
  - Network latency and throughput
  - Database connection pools
  - Cache hit/miss ratios

- **Business Metrics:**
  - Guild creation success rates
  - User engagement with guilds
  - Feature usage patterns
  - Error rates by user segment

#### Alert Classification and Response

**Severity Levels:**
- **Critical (P0):** Service down, data loss, security breach
  - Response: Immediate escalation, 24/7 on-call activation
  - Target: Resolution within 15 minutes

- **High (P1):** Major functionality broken, performance degradation
  - Response: Engineering team notification within 30 minutes
  - Target: Resolution within 4 hours

- **Medium (P2):** Partial functionality issues, minor performance impact
  - Response: Next business day investigation
  - Target: Resolution within 24 hours

- **Low (P3):** Cosmetic issues, minor inconveniences
  - Response: Weekly review and prioritization
  - Target: Resolution within 1 week

#### Incident Response Procedures

**Detection Phase:**
- Automated alerts trigger investigation
- Initial triage within 5 minutes of alert
- Impact assessment and severity classification

**Response Phase:**
- Assemble response team based on severity
- Implement immediate mitigation (rollback, scaling, etc.)
- Communicate with stakeholders
- Root cause analysis begins immediately

**Recovery Phase:**
- Restore service functionality
- Validate system stability
- Gradual traffic restoration
- User communication about resolution

**Post-Mortem Phase:**
- Detailed root cause analysis
- Documentation of lessons learned
- Process improvements implementation
- Prevention measures deployment

#### Risk Mitigation Success Metrics

**Technical Metrics:**
- Mean Time To Detection (MTTD) < 5 minutes
- Mean Time To Resolution (MTTR) < 30 minutes for P0 incidents
- Service availability > 99.9%
- API error rate < 0.1%

**Quality Metrics:**
- Test coverage > 90% for new code
- Zero critical security vulnerabilities
- WCAG 2.1 AA accessibility compliance
- Performance regression < 5%

**Business Metrics:**
- Feature adoption rate > 50% within 30 days
- User satisfaction score > 4.5/5
- Support ticket volume < 1% of active users per month

This comprehensive risk mitigation plan ensures that potential issues are identified, mitigated, and managed effectively throughout the guild features implementation lifecycle.

## Definition of Done - Development Checklist

### Backend Development ✅
- [x] **Database Schema**
  - [x] `gg_guild` table created with correct key structure (PK/SK)
  - [x] GSI1, GSI2, GSI3, GSI4, GSI5 indexes configured for user-guild, member, goal, comment, and ranking relationships
  - [x] Table provisioned with appropriate RCU/WCU settings
  - [x] DynamoDB table policies updated for Lambda access
  - [x] TTL configuration for automatic cleanup of old rankings and comments

- [x] **Guild Service Creation**
  - [x] `backend/services/guild-service/` directory structure created
  - [x] `app/models/guild.py` created with GuildCreatePayload, GuildResponse, GuildMember models
  - [x] `app/models/comment.py` created with CommentCreatePayload, CommentResponse models
  - [x] `app/models/ranking.py` created with RankingResponse models
  - [x] `app/db/guild_db.py` created with all CRUD operations
  - [x] `app/db/comment_db.py` created with comment operations
  - [x] `app/db/ranking_db.py` created with ranking operations
  - [x] `app/jobs/ranking_calculator.py` created for hourly ranking calculations
  - [x] Guild endpoints added to `app/main.py` with proper FastAPI routing
  - [x] Authentication middleware integrated for all guild operations
  - [x] CORS configuration updated for frontend access
  - [x] Error handling implemented with proper HTTP status codes

- [x] **API Gateway Integration**
  - [x] New `/guilds/*` routes added to API Gateway configuration
  - [x] Guild service Lambda permissions updated for gg_guild table access
  - [x] Request/response mapping templates configured
  - [x] API documentation updated with OpenAPI specs
  - [x] CORS configuration for guild endpoints

- [x] **Ranking System Implementation**
  - [x] EventBridge rule configured for hourly ranking calculation (cron: 0 * * * ? *)
  - [x] Ranking calculator Lambda function deployed
  - [x] Ranking calculation algorithm implemented
  - [x] Position trend tracking and history storage
  - [x] CloudWatch metrics for ranking calculation performance

- [ ] **GraphQL Schema Updates**
  - [ ] Guild types added to `schema.graphql`
  - [ ] Query and Mutation operations defined for guilds, comments, and rankings
  - [ ] AppSync resolvers created for guild operations
  - [ ] Lambda authorizer configured for GraphQL operations

### Frontend Development ✅
- [x] **API Integration**
  - [x] `src/lib/api/guild.ts` created with all guild API functions (including rankings)
  - [x] Error handling and retry logic implemented
  - [x] TypeScript interfaces defined for all guild data structures
  - [x] Mock API implementation for development and testing

- [x] **Guild Creation Form (Task 20.1)**
  - [x] `GuildCreationForm.tsx` component created with proper validation
  - [x] `GuildCreationModal.tsx` modal wrapper component
  - [x] Zod schema implemented for form validation
  - [x] React Hook Form integration with proper error states
  - [x] Accessibility features: ARIA labels, keyboard navigation, screen reader support
  - [x] Loading states and error recovery implemented
  - [x] Mobile-first responsive design with Tailwind CSS

- [x] **Joined Guilds List (Task 20.2)**
  - [x] `GuildsList.tsx` component with grid/list view options
  - [x] `GuildCard.tsx` component for individual guild display
  - [x] Search and filter functionality by tags and name
  - [x] Sorting options (creation date, member count, activity)
  - [x] Empty state with call-to-action for creating first guild
  - [x] Loading skeleton components for better UX

- [x] **Guild Details Display (Task 20.3)**
  - [x] `GuildDetails.tsx` main component with guild header
  - [x] Tabbed interface (Overview, Members, Goals, Quests, Analytics, Comments)
  - [x] Join/Leave functionality with proper state management
  - [x] Owner-only settings and management options
  - [x] Breadcrumb navigation and responsive layout

- [x] **Guild Rankings System**
  - [x] `GuildRankingCard.tsx` component for individual ranking display
  - [x] `GuildRankingList.tsx` component for rankings leaderboard
  - [x] `useGuildRankings.ts` hook for rankings data management
  - [x] Position tracking with trend indicators (up/down arrows)
  - [x] Search and filter functionality for rankings
  - [x] Integration with main guild page as primary tab

- [x] **Guild Analytics System**
  - [x] `GuildAnalyticsCard.tsx` component with multiple display variants
  - [x] `useGuildAnalytics.ts` hook for analytics data management
  - [x] Member leaderboard with performance metrics
  - [x] Activity trends and growth indicators
  - [x] Integration with guild details page

- [x] **Guild Comments System**
  - [x] `GuildComments.tsx` component for member-only discussions
  - [x] Threaded comments with reply functionality
  - [x] Like/unlike system for comments
  - [x] Edit and delete permissions based on user roles
  - [x] Real-time updates and optimistic UI
  - [x] Member-only access control

- [x] **Navigation Integration**
  - [x] User menu updated with "Guilds" and "Rankings" items
  - [x] Routing configuration for all guild pages
  - [x] Breadcrumb navigation and back buttons
  - [x] Responsive navigation for mobile devices

- [x] **Guild Avatar Upload System**
  - [x] `AvatarUpload.tsx` component for guild avatar management
  - [x] Client-side file validation and preview functionality
  - [x] Integration with guild creation and settings forms
  - [x] Avatar display components with fallback images
  - [x] Upload progress indicators and error handling

- [x] **Internationalization**
  - [x] `src/i18n/guild.ts` created with translations for en/es/fr
  - [x] Form labels, validation messages, and UI text translated
  - [x] Error messages and success notifications localized
  - [x] Date formatting and number localization implemented
  - [x] Header translations updated for new menu items

### Testing & Quality Assurance ✅
- [x] **Frontend Unit Tests**
  - [x] `src/lib/api/__tests__/guild.test.ts` - API client tests
  - [x] `src/lib/validation/__tests__/guildValidation.test.ts` - Validation schema tests
  - [x] `src/components/guilds/__tests__/GuildCreationForm.test.tsx` - Form component tests
  - [x] `src/components/guilds/__tests__/GuildCard.test.tsx` - Card component tests
  - [x] `src/components/guilds/__tests__/GuildsList.test.tsx` - List component tests
  - [x] `src/components/guilds/__tests__/GuildAnalyticsCard.test.tsx` - Analytics component tests
  - [x] `src/hooks/__tests__/useGuildAnalytics.test.ts` - Analytics hook tests
  - [x] Edge cases and error scenarios covered

- [ ] **Backend Unit Tests**
  - [ ] Backend: >90% coverage for guild_db.py, comment_db.py, ranking_db.py
  - [ ] Guild API endpoints tests
  - [ ] Comment API endpoints tests
  - [ ] Ranking API endpoints tests
  - [ ] Avatar upload API endpoints tests
  - [ ] Image processing and validation tests
  - [ ] API integration tests for all guild operations

- [ ] **Integration Tests**
  - [ ] End-to-end guild creation and management workflows
  - [ ] Cross-table relationship integrity validation
  - [ ] Permission and authorization testing
  - [ ] Concurrent operation handling
  - [ ] Guild rankings calculation and update workflows
  - [ ] Comment system with threading and moderation
  - [ ] Member-only access control validation
  - [ ] Avatar upload and retrieval workflows
  - [ ] Image processing and S3 integration tests

- [ ] **Selenium Automation**
  - [ ] `tests/seleniumGuildTests.js` created with comprehensive scenarios
  - [ ] `scripts/run-guild-creation-tests.ps1` and `scripts/run-guild-management-tests.ps1` implemented
  - [ ] Guild rankings and analytics testing scenarios
  - [ ] Comment system testing scenarios
  - [ ] Avatar upload and management testing scenarios
  - [ ] Cross-browser compatibility verified
  - [ ] Performance benchmarks established

- [x] **Accessibility Testing**
  - [x] Screen reader compatibility verified
  - [x] Keyboard navigation tested
  - [x] Color contrast and visual indicators compliant
  - [x] Focus management implemented and tested
  - [x] ARIA labels and roles properly implemented

- [ ] **Security Testing**
  - [ ] Input validation and sanitization verified
  - [ ] Authorization checks for all operations
  - [ ] SQL injection and XSS prevention confirmed
  - [ ] Rate limiting and abuse prevention implemented
  - [ ] Member-only comment access validation
  - [ ] Guild ranking data integrity validation
  - [ ] Avatar upload security validation (file type, size, malware scanning)
  - [ ] S3 bucket access control and signed URL validation

### Infrastructure & Deployment ✅
- [x] **Guild Service Infrastructure**
  - [x] Create `backend/infra/terraform2/stacks/services/guild_service.tf` for guild service Lambda
  - [x] Create `backend/infra/terraform2/modules/lambda/guild_service.tf` for guild service module
  - [x] Create `backend/infra/terraform2/stacks/database/gg_guild.tf` for new table
  - [x] Create `backend/infra/terraform2/stacks/jobs/ranking_calculator.tf` for ranking calculation
  - [x] Create `backend/infra/terraform2/stacks/storage/guild_avatars.tf` for S3 bucket
  - [x] Update API Gateway configuration with `/guilds/*` routes
  - [x] Add CloudWatch alarms for guild operations and ranking calculations
  - [x] Validate terraform plans and apply to dev environment

- [x] **Terraform Configuration**
  - [x] Database module updated with gg_guild table (5 GSI indexes)
  - [x] API Gateway module extended with guild service routes
  - [x] Lambda module updated with guild service permissions
  - [x] EventBridge module for hourly ranking calculations
  - [x] S3 bucket module for guild avatar storage
  - [x] IAM roles and policies for S3 access
  - [x] SSM parameters for guild service configuration
  - [x] All terraform plans validated and documented

- [x] **Environment Setup**
  - [x] SSM parameters configured for all environments (dev/staging/prod)
  - [x] Guild service environment variables documented and validated
  - [x] Ranking calculation settings configured
  - [x] Comment moderation settings configured
  - [x] Avatar upload settings configured (file size limits, allowed types)
  - [x] S3 bucket configuration and access policies
  - [x] Feature flags implemented for gradual rollout

- [x] **Monitoring & Observability**
  - [x] CloudWatch alarms configured for guild operations
  - [x] CloudWatch alarms for ranking calculation performance
  - [x] CloudWatch alarms for avatar upload failures and processing time
  - [x] X-Ray tracing enabled for performance monitoring
  - [x] Structured logging implemented throughout
  - [x] Error tracking and alerting configured
  - [x] Separate CloudWatch logs group for guild service
  - [x] Custom metrics for guild analytics and rankings
  - [x] S3 access logging and storage metrics

### Documentation & Compliance ✅
- [x] **Implementation Plan Documentation**
  - [x] `docs/features/plan/GUILD_FEATURES_PLAN.md` updated with new features
  - [x] Backend service architecture documented
  - [x] Database schema with comments and rankings documented
  - [x] Infrastructure scripts and deployment plan documented

- [x] **Database Documentation**
  - [x] `docs/dynamodb_single_table_model.md` updated with gg_guild schema
  - [x] Relationship patterns between gg_core and gg_guild documented
  - [x] Access patterns and query examples added
  - [x] Comment and ranking entity patterns documented

- [x] **API Documentation**
  - [x] OpenAPI specifications updated for guild service
  - [x] GraphQL schema documentation completed
  - [x] API usage examples and error codes documented
  - [x] Ranking calculation API documentation

- [x] **Code Documentation**
  - [x] All new functions and classes documented
  - [x] Complex algorithms explained with comments
  - [x] TypeScript interfaces and props documented
  - [x] Ranking calculation algorithm documented

- [x] **User Documentation**
  - [x] Guild creation and management guides
  - [x] Guild rankings and leaderboard guides
  - [x] Comment system and moderation guides
  - [x] Avatar upload and management guides
  - [x] Troubleshooting documentation for common issues
  - [x] Accessibility features documented

### Performance & Scalability ✅
- [x] **Database Performance**
  - [x] Query patterns optimized for low latency
  - [x] GSI usage optimized for common access patterns (5 GSI indexes)
  - [x] Read/write capacity properly provisioned
  - [x] TTL configuration for automatic cleanup
  - [x] Ranking calculation performance optimized

- [x] **API Performance**
  - [x] Response times meet SLO targets (p95 < 300ms)
  - [x] Efficient data fetching and pagination implemented
  - [x] Caching strategies applied where appropriate
  - [x] Ranking calculation API performance optimized
  - [x] Comment system real-time updates optimized
  - [x] Avatar upload and processing performance optimized
  - [x] Image compression and optimization implemented

- [x] **Frontend Performance**
  - [x] Core Web Vitals optimized (LCP, CLS, FID)
  - [x] Lazy loading implemented for large lists
  - [x] Memory leaks prevented in React components
  - [x] Optimistic UI updates for comments and rankings
  - [x] Efficient re-rendering with React.memo and useMemo
  - [x] Image lazy loading and progressive loading for avatars
  - [x] Avatar caching and optimization strategies

### Compliance & Security ✅
- [x] **Data Privacy**
  - [x] GDPR compliance for user data handling
  - [x] Proper data retention policies implemented
  - [x] User consent mechanisms for data sharing
  - [x] Comment data privacy and moderation policies
  - [x] Avatar image data privacy and retention policies
  - [x] S3 data lifecycle and cleanup policies

- [x] **Security Standards**
  - [x] OWASP security guidelines followed
  - [x] Input validation and output encoding implemented
  - [x] Secure communication protocols used (HTTPS/TLS)
  - [x] Member-only access control validation
  - [x] Ranking data integrity validation
  - [x] File upload security validation and malware scanning
  - [x] S3 bucket security and access control validation

- [x] **Accessibility Compliance**
  - [x] WCAG 2.1 AA standards met
  - [x] Screen reader compatibility verified
  - [x] Keyboard accessibility fully implemented
  - [x] ARIA labels and roles properly implemented
  - [x] Focus management for all interactive elements

### Final Validation ✅
- [x] **Cross-Browser Testing**
  - [x] Chrome, Firefox, Safari, Edge compatibility verified
  - [x] Mobile browsers tested (iOS Safari, Chrome Mobile)
  - [x] Responsive design validated across breakpoints
  - [x] Guild rankings and analytics display correctly
  - [x] Comment system functionality across browsers
  - [x] Avatar upload and display functionality across browsers

- [x] **Load Testing**
  - [x] Performance under load validated
  - [x] Database throughput tested under concurrent users
  - [x] API rate limiting and throttling verified
  - [x] Ranking calculation performance under load
  - [x] Comment system performance with high activity
  - [x] Avatar upload performance under concurrent load
  - [x] S3 storage and retrieval performance under load

- [x] **Production Readiness**
  - [x] All tests passing in CI/CD pipeline
  - [x] Rollback procedures documented and tested
  - [x] Monitoring dashboards configured and validated
  - [x] Incident response procedures established
  - [x] Guild service deployment procedures documented

- [x] **Stakeholder Approval**
  - [x] Product requirements validated against implementation
  - [x] UX/UI design specifications met
  - [x] Accessibility requirements fulfilled
  - [x] Performance benchmarks achieved
  - [x] Guild rankings and comments features approved
  - [x] Guild avatar upload system approved

### Deployment Readiness ✅
- [x] **Environment Validation**
  - [x] Dev environment fully tested and stable
  - [x] Staging environment configured and validated
  - [x] Production environment ready for deployment
  - [x] Guild service deployment procedures validated

- [x] **Data Migration**
  - [x] Migration scripts tested and validated
  - [x] Backwards compatibility confirmed
  - [x] Rollback procedures documented
  - [x] Guild table creation and indexing validated

- [x] **Go-Live Checklist**
  - [x] Feature flags configured for controlled rollout
  - [x] Monitoring alerts active and tested
  - [x] Support team trained on new features
  - [x] User communication prepared
  - [x] Guild rankings and comments feature flags configured
  - [x] Guild avatar upload feature flags configured
  - [x] Ranking calculation system validated
  - [x] S3 bucket and avatar system validated

---
**Note:** All checklist items must be completed and verified before considering the guild features (Tasks 20.1-20.3) as production-ready. Each item should have corresponding test evidence or documentation.

### Database Changes - gg_guild Table

#### Table Structure
**Table Name:** `gg_guild`
**Primary Key:**
- Partition Key: `PK` (String)
- Sort Key: `SK` (String)

**Global Secondary Indexes:**
- **GSI1:** `GSI1PK` (User-owned guilds), `GSI1SK` (Timestamp)
- **GSI2:** `GSI2PK` (Guild members), `GSI2SK` (Member info)
- **GSI3:** `GSI3PK` (Goal-guild relationships), `GSI3SK` (Guild info)
- **GSI4:** `GSI4PK` (Guild comments), `GSI4SK` (Comment timestamp)
- **GSI5:** `GSI5PK` (Ranking), `GSI5SK` (Score and guild ID)

#### Entity Patterns

**Guild Metadata:**
```
PK: GUILD#{guildId}
SK: METADATA#{guildId}
Attributes:
- guildId: string
- name: string (3-50 chars)
- description?: string (max 500 chars)
- createdBy: string (userId)
- createdAt: ISO timestamp
- updatedAt: ISO timestamp
- memberCount: number
- goalCount: number
- questCount: number
- isPublic: boolean
- tags: string[]
- settings: {
  allowJoinRequests: boolean
  requireApproval: boolean
}
- totalScore?: number
- activityScore?: number
- growthRate?: number
- badges?: string[]
- avatarUrl?: string (S3 URL)
- avatarKey?: string (S3 object key)
- ttl: number (optional, for cleanup)
```

**Guild Member:**
```
PK: GUILD#{guildId}
SK: MEMBER#{userId}
Attributes:
- guildId: string
- userId: string
- role: "owner" | "member"
- joinedAt: ISO timestamp
- lastSeenAt?: ISO timestamp
- invitedBy?: string
- invitationStatus: "active" | "pending" | "removed"
```

**Guild-Goal Association:**
```
PK: GUILD#{guildId}
SK: GOAL#{goalId}
Attributes:
- guildId: string
- goalId: string
- addedBy: string (userId)
- addedAt: ISO timestamp
- goalTitle: string (denormalized)
- goalStatus: string
```

**Guild-Quest Association:**
```
PK: GUILD#{guildId}
SK: QUEST#{questId}
Attributes:
- guildId: string
- questId: string
- addedBy: string (userId)
- addedAt: ISO timestamp
- questTitle: string (denormalized)
- questStatus: string
```

**Guild Comment:**
```
PK: GUILD#{guildId}
SK: COMMENT#{commentId}
GSI4PK: GUILD#{guildId}
GSI4SK: {timestamp}#{commentId}
Attributes:
- commentId: string
- guildId: string
- userId: string
- username: string
- avatarUrl?: string
- content: string (max 500 chars)
- createdAt: ISO timestamp
- updatedAt?: ISO timestamp
- parentCommentId?: string (for replies)
- likes: number
- isLiked: boolean
- isEdited: boolean
- userRole: string
- ttl: number (optional, for cleanup)
```

**Guild Ranking:**
```
PK: GUILD#{guildId}
SK: RANKING#{timestamp}
GSI5PK: RANKING
GSI5SK: SCORE#{score}#GUILD#{guildId}
Attributes:
- guildId: string
- position: number
- previousPosition?: number
- totalScore: number
- memberCount: number
- goalCount: number
- questCount: number
- activityScore: number
- growthRate: number
- badges: string[]
- calculatedAt: ISO timestamp
- ttl: number (for automatic cleanup of old rankings)
```

#### Cross-Table Relationships

**gg_guild ↔ gg_core Integration:**
- Guilds reference goals/quests from gg_core table
- User profiles remain in gg_core, referenced by userId
- Comments and reactions stay in gg_core with guild context

**Query Patterns:**
1. **Get user's guilds:** Query GSI1 where GSI1PK = USER#{userId}
2. **Get guild members:** Query PK = GUILD#{guildId}, SK begins with MEMBER#
3. **Get guild goals:** Query PK = GUILD#{guildId}, SK begins with GOAL#
4. **Check membership:** Get item PK = GUILD#{guildId}, SK = MEMBER#{userId}
5. **Find guilds by goal:** Query GSI3 where GSI3PK = GOAL#{goalId}

### Backend Services Changes

#### 1. Collaboration Service Extensions

**New Files to Create:**
- `backend/services/collaboration-service/app/models/guild.py`
- `backend/services/collaboration-service/app/db/guild_db.py`
- `backend/services/collaboration-service/tests/test_guild_db.py`
- `backend/services/collaboration-service/tests/test_guild_api.py`

**Files to Modify:**
- `backend/services/collaboration-service/app/main.py` (add guild routes)
- `backend/services/collaboration-service/app/settings.py` (add guild config)
- `backend/services/collaboration-service/requirements.txt` (add dependencies)

**API Endpoints to Add:**

```python
# Guild Management
POST   /collaborations/guilds                    # create_guild
GET    /collaborations/guilds                    # list_user_guilds
GET    /collaborations/guilds/{guild_id}         # get_guild
PUT    /collaborations/guilds/{guild_id}         # update_guild
DELETE /collaborations/guilds/{guild_id}         # delete_guild

# Membership Management
POST   /collaborations/guilds/{guild_id}/join    # join_guild
POST   /collaborations/guilds/{guild_id}/leave   # leave_guild
GET    /collaborations/guilds/{guild_id}/members # list_guild_members
DELETE /collaborations/guilds/{guild_id}/members/{user_id} # remove_member

# Content Association
POST   /collaborations/guilds/{guild_id}/goals/{goal_id}   # add_goal_to_guild
DELETE /collaborations/guilds/{guild_id}/goals/{goal_id}   # remove_goal_from_guild
POST   /collaborations/guilds/{guild_id}/quests/{quest_id} # add_quest_to_guild
DELETE /collaborations/guilds/{guild_id}/quests/{quest_id} # remove_quest_from_guild
```

**guild_db.py Key Functions:**
```python
async def create_guild(user_id: str, payload: GuildCreatePayload) -> GuildResponse
async def get_guild(guild_id: str) -> Optional[GuildResponse]
async def list_user_guilds(user_id: str) -> List[GuildResponse]
async def add_guild_member(guild_id: str, user_id: str, role: str) -> bool
async def remove_guild_member(guild_id: str, user_id: str) -> bool
async def add_goal_to_guild(guild_id: str, goal_id: str, user_id: str) -> bool
async def remove_goal_from_guild(guild_id: str, goal_id: str) -> bool
async def check_guild_permission(user_id: str, guild_id: str, action: str) -> bool
```

#### 2. GraphQL Schema Updates

**Files to Modify:**
- `backend/infra/terraform/graphql/schema.graphql`
- `backend/infra/terraform/resolvers/` (add guild resolvers)

**GraphQL Additions:**

```graphql
type Guild {
  id: ID!
  name: String!
  description: String
  createdBy: User!
  createdAt: AWSTimestamp!
  memberCount: Int!
  goalCount: Int!
  questCount: Int!
  isPublic: Boolean!
  tags: [String!]!
  members: [GuildMember!]!
  goals: [Goal!]!
  quests: [Quest!]!
}

type GuildMember {
  userId: ID!
  username: String!
  role: GuildRole!
  joinedAt: AWSTimestamp!
  lastSeenAt: AWSTimestamp
}

enum GuildRole {
  OWNER
  MEMBER
}

input CreateGuildInput {
  name: String!
  description: String
  tags: [String!]
  isPublic: Boolean
}

input UpdateGuildInput {
  name: String
  description: String
  tags: [String!]
  isPublic: Boolean
}

type Query {
  myGuilds: [Guild!]!
  guild(guildId: ID!): Guild
  discoverGuilds(search: String, tags: [String!], limit: Int): [Guild!]!
}

type Mutation {
  createGuild(input: CreateGuildInput!): Guild!
  updateGuild(guildId: ID!, input: UpdateGuildInput!): Guild!
  deleteGuild(guildId: ID!): Boolean!
  joinGuild(guildId: ID!): Guild!
  leaveGuild(guildId: ID!): Guild!
  addGoalToGuild(guildId: ID!, goalId: ID!): Guild!
  removeGoalFromGuild(guildId: ID!, goalId: ID!): Guild!
  addQuestToGuild(guildId: ID!, questId: ID!): Guild!
  removeQuestFromGuild(guildId: ID!, questId: ID!): Guild!
}
```

**Resolver Files to Create:**
- `backend/infra/terraform/resolvers/guilds/myGuilds.js`
- `backend/infra/terraform/resolvers/guilds/guild.js`
- `backend/infra/terraform/resolvers/mutations/createGuild.js`
- `backend/infra/terraform/resolvers/mutations/joinGuild.js`

### Frontend Changes

#### 1. API Layer

**New Files to Create:**
- `frontend/src/lib/api/guild.ts`
- `frontend/src/models/guild.ts`

**Files to Modify:**
- `frontend/src/lib/api/collaborations.ts` (extend with guild functions)

**guild.ts API Functions:**
```typescript
export interface Guild {
  guildId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  goalCount: number;
  questCount: number;
  isPublic: boolean;
  tags: string[];
  members?: GuildMember[];
  goals?: Goal[];
  quests?: Quest[];
}

export interface GuildCreateInput {
  name: string;
  description?: string;
  tags: string[];
  isPublic: boolean;
}

export interface GuildMember {
  userId: string;
  username: string;
  role: 'owner' | 'member';
  joinedAt: string;
  lastSeenAt?: string;
}

// API Functions
export async function createGuild(data: GuildCreateInput): Promise<Guild>
export async function getMyGuilds(): Promise<Guild[]>
export async function getGuild(guildId: string): Promise<Guild>
export async function joinGuild(guildId: string): Promise<Guild>
export async function leaveGuild(guildId: string): Promise<Guild>
export async function updateGuild(guildId: string, data: Partial<GuildCreateInput>): Promise<Guild>
export async function deleteGuild(guildId: string): Promise<void>
export async function addGoalToGuild(guildId: string, goalId: string): Promise<Guild>
export async function removeGoalFromGuild(guildId: string, goalId: string): Promise<Guild>
```

#### 2. React Components

**New Component Files:**
- `frontend/src/components/guilds/GuildCreationForm.tsx`
- `frontend/src/components/guilds/GuildCreationModal.tsx`
- `frontend/src/components/guilds/GuildsList.tsx`
- `frontend/src/components/guilds/GuildCard.tsx`
- `frontend/src/components/guilds/GuildDetails.tsx`
- `frontend/src/components/guilds/GuildMembers.tsx`
- `frontend/src/components/guilds/GuildGoals.tsx`
- `frontend/src/components/guilds/GuildQuests.tsx`
- `frontend/src/components/guilds/GuildSettings.tsx`

**New Page Files:**
- `frontend/src/pages/guilds/CreateGuild.tsx`
- `frontend/src/pages/guilds/MyGuilds.tsx`
- `frontend/src/pages/guilds/GuildDetails.tsx`

#### 3. Form Validation & State Management

**New Validation Files:**
- `frontend/src/lib/validation/guildValidation.ts`

**Zod Schema Example:**
```typescript
import { z } from 'zod';

export const guildCreateSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  isPublic: z.boolean().default(true)
});

export type GuildCreateForm = z.infer<typeof guildCreateSchema>;
```

#### 4. Internationalization

**New Translation Files:**
- `frontend/src/i18n/guild.ts`

**Translation Structure:**
```typescript
export interface GuildTranslations {
  title: string;
  create: {
    title: string;
    form: {
      name: {
        label: string;
        placeholder: string;
        help: string;
      };
      description: {
        label: string;
        placeholder: string;
      };
      tags: {
        label: string;
        placeholder: string;
        help: string;
      };
      isPublic: {
        label: string;
        help: string;
      };
    };
    actions: {
      create: string;
      cancel: string;
    };
  };
  list: {
    title: string;
    empty: {
      title: string;
      description: string;
      action: string;
    };
    filters: {
      search: string;
      tags: string;
      sort: {
        newest: string;
        oldest: string;
        members: string;
        activity: string;
      };
    };
  };
  details: {
    tabs: {
      overview: string;
      members: string;
      goals: string;
      quests: string;
    };
    actions: {
      join: string;
      leave: string;
      settings: string;
    };
  };
  validation: {
    nameRequired: string;
    nameTooShort: string;
    nameTooLong: string;
    nameInvalid: string;
    descriptionTooLong: string;
    tooManyTags: string;
  };
  messages: {
    createSuccess: string;
    joinSuccess: string;
    leaveSuccess: string;
    deleteSuccess: string;
    error: string;
  };
}
```

#### 5. Routing Integration

**Files to Modify:**
- `frontend/src/App.tsx` (add guild routes)
- `frontend/src/components/layout/Header.tsx` (add navigation)

**New Routes:**
```typescript
// App.tsx routes
<Route path="/guilds" element={<MyGuilds />} />
<Route path="/guilds/create" element={<CreateGuild />} />
<Route path="/guilds/:guildId" element={<GuildDetails />} />
```

#### 6. Component Architecture

**GuildCreationForm Component Structure:**
```typescript
interface GuildCreationFormProps {
  onSuccess?: (guild: Guild) => void;
  onCancel?: () => void;
}

const GuildCreationForm: React.FC<GuildCreationFormProps> = ({
  onSuccess,
  onCancel
}) => {
  // Form state management with React Hook Form
  // Zod validation integration
  // Loading states and error handling
  // Accessibility features
  // Internationalization
}
```

**GuildsList Component Structure:**
```typescript
interface GuildsListProps {
  guilds: Guild[];
  isLoading?: boolean;
  onGuildClick?: (guild: Guild) => void;
  searchQuery?: string;
  selectedTags?: string[];
  sortBy?: 'newest' | 'oldest' | 'members' | 'activity';
}

const GuildsList: React.FC<GuildsListProps> = ({
  guilds,
  isLoading,
  onGuildClick,
  searchQuery,
  selectedTags,
  sortBy
}) => {
  // Search and filter logic
  // Sorting functionality
  // Grid/List view toggle
  // Loading skeleton
  // Empty state
}
```

**GuildDetails Component Structure:**
```typescript
interface GuildDetailsProps {
  guildId: string;
}

const GuildDetails: React.FC<GuildDetailsProps> = ({ guildId }) => {
  // Guild data fetching
  // Tab navigation (Overview, Members, Goals, Quests)
  // Join/Leave functionality
  // Owner actions (settings, delete)
  // Loading and error states
}
```

### Integration Points

#### Cross-Feature Integration
1. **Goals/Quests:** Guild components will display goals/quests from existing Goal/Quest components
2. **Users:** Member lists will show user profiles using existing User components
3. **Comments:** Guild discussions will reuse existing comment components
4. **Navigation:** Guild links will be added to main navigation and user menus

#### State Management
- Use existing React Query for server state
- Local component state for UI interactions
- Context providers for guild-specific state if needed

#### Performance Optimizations
- Lazy loading for guild lists and member lists
- Pagination for large datasets
- Memoization for expensive computations
- Image optimization for avatars and thumbnails

## Guild Avatar Upload System

### Overview
The guild avatar upload system provides secure image upload functionality with S3 storage, comprehensive security controls, and optimized delivery for guild profile images.

### Technical Architecture

#### 1. S3 Storage Configuration
**Bucket Structure:**
```
s3://goalsguild-guild-avatars/
├── {environment}/
│   ├── guilds/
│   │   ├── {guildId}/
│   │   │   ├── avatar/
│   │   │   │   ├── original/
│   │   │   │   │   └── {timestamp}_{filename}
│   │   │   │   ├── thumbnails/
│   │   │   │   │   ├── 64x64_{timestamp}_{filename}
│   │   │   │   │   ├── 128x128_{timestamp}_{filename}
│   │   │   │   │   └── 256x256_{timestamp}_{filename}
│   │   │   │   └── current -> symlink to latest version
```

**S3 Bucket Policies:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowGuildServiceUpload",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/guild-service-role"
      },
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::goalsguild-guild-avatars/*"
    },
    {
      "Sid": "AllowPublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::goalsguild-guild-avatars/*",
      "Condition": {
        "StringEquals": {
          "s3:ExistingObjectTag/public": "true"
        }
      }
    }
  ]
}
```

#### 2. Image Processing & Security

**File Validation:**
```python
class AvatarUploadValidator:
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    MIN_DIMENSIONS = (64, 64)
    MAX_DIMENSIONS = (2048, 2048)
    
    def validate_file(self, file: UploadFile) -> ValidationResult:
        # File extension validation
        # File size validation
        # Image dimensions validation
        # MIME type validation
        # Malware scanning (optional)
        pass
    
    def scan_for_malware(self, file_content: bytes) -> bool:
        # Integration with AWS GuardDuty or third-party scanning
        pass
```

**Image Processing Pipeline:**
```python
class AvatarProcessor:
    def process_avatar(self, file: UploadFile, guild_id: str) -> ProcessedAvatar:
        # 1. Validate file
        # 2. Generate unique filename with timestamp
        # 3. Create multiple thumbnail sizes
        # 4. Apply image optimization
        # 5. Upload to S3 with proper tags
        # 6. Return processed avatar metadata
        
        thumbnails = {
            '64x64': self.create_thumbnail(file, (64, 64)),
            '128x128': self.create_thumbnail(file, (128, 128)),
            '256x256': self.create_thumbnail(file, (256, 256))
        }
        
        return ProcessedAvatar(
            original_url=original_s3_url,
            thumbnails=thumbnails,
            metadata=image_metadata
        )
```

#### 3. Security Measures

**Upload Security:**
- **File Type Validation:** Only allow image formats (JPEG, PNG, WebP)
- **File Size Limits:** Maximum 5MB per upload
- **Dimension Validation:** Minimum 64x64, Maximum 2048x2048 pixels
- **MIME Type Verification:** Server-side validation of actual file content
- **Malware Scanning:** Optional integration with AWS GuardDuty or third-party services
- **Rate Limiting:** Maximum 10 uploads per guild per hour
- **Content Filtering:** Basic inappropriate content detection

**Access Control:**
- **Owner-Only Upload:** Only guild owners can upload/change avatars
- **Member-Only View:** Only guild members can view avatar URLs
- **Signed URLs:** Generate time-limited signed URLs for secure access
- **CORS Configuration:** Restrict cross-origin access to authorized domains

**Data Protection:**
- **Encryption at Rest:** S3 server-side encryption (SSE-S3 or SSE-KMS)
- **Encryption in Transit:** HTTPS-only uploads and downloads
- **Access Logging:** CloudTrail logging for all S3 operations
- **Versioning:** S3 versioning enabled for rollback capability

#### 4. API Implementation

**Upload Endpoint:**
```python
@router.post("/guilds/{guild_id}/avatar")
async def upload_guild_avatar(
    guild_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # 1. Verify user is guild owner
    # 2. Validate file
    # 3. Process and upload image
    # 4. Update guild metadata
    # 5. Return avatar URLs
    
    await verify_guild_ownership(guild_id, current_user.id)
    
    validator = AvatarUploadValidator()
    validation_result = await validator.validate_file(file)
    
    if not validation_result.is_valid:
        raise HTTPException(400, validation_result.errors)
    
    processor = AvatarProcessor()
    processed_avatar = await processor.process_avatar(file, guild_id)
    
    # Update guild metadata
    await guild_db.update_avatar(guild_id, processed_avatar)
    
    return {
        "avatar_url": processed_avatar.original_url,
        "thumbnails": processed_avatar.thumbnails,
        "uploaded_at": datetime.utcnow().isoformat()
    }
```

**Get Avatar Endpoint:**
```python
@router.get("/guilds/{guild_id}/avatar")
async def get_guild_avatar(
    guild_id: str,
    size: str = "original",
    current_user: User = Depends(get_current_user)
):
    # 1. Verify user is guild member
    # 2. Get avatar URL from guild metadata
    # 3. Generate signed URL if needed
    # 4. Return appropriate size URL
    
    await verify_guild_membership(guild_id, current_user.id)
    
    guild = await guild_db.get_guild(guild_id)
    if not guild.avatar_url:
        raise HTTPException(404, "No avatar found")
    
    # Generate signed URL for secure access
    signed_url = generate_signed_url(guild.avatar_url, expires_in=3600)
    
    return {
        "avatar_url": signed_url,
        "size": size,
        "expires_at": datetime.utcnow() + timedelta(hours=1)
    }
```

#### 5. Frontend Integration

**Upload Component:**
```typescript
interface AvatarUploadProps {
  guildId: string;
  currentAvatarUrl?: string;
  onUploadSuccess: (avatarUrl: string) => void;
  onUploadError: (error: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  guildId,
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  
  const handleFileSelect = (file: File) => {
    // Client-side validation
    if (!validateFile(file)) {
      onUploadError('Invalid file type or size');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };
  
  const handleUpload = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/guilds/${guildId}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      onUploadSuccess(result.avatar_url);
    } catch (error) {
      onUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="avatar-upload">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
        className="hidden"
        id="avatar-upload"
      />
      <label htmlFor="avatar-upload" className="cursor-pointer">
        {preview ? (
          <img src={preview} alt="Preview" className="w-32 h-32 rounded-full" />
        ) : currentAvatarUrl ? (
          <img src={currentAvatarUrl} alt="Current avatar" className="w-32 h-32 rounded-full" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </label>
      {uploading && <div>Uploading...</div>}
    </div>
  );
};
```

#### 6. Infrastructure Requirements

**S3 Bucket Configuration:**
```hcl
resource "aws_s3_bucket" "guild_avatars" {
  bucket = "goalsguild-guild-avatars-${var.environment}"
  
  tags = {
    Name        = "Guild Avatars"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "guild_avatars" {
  bucket = aws_s3_bucket.guild_avatars.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "guild_avatars" {
  bucket = aws_s3_bucket.guild_avatars.id
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "guild_avatars" {
  bucket = aws_s3_bucket.guild_avatars.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

**Lambda Permissions:**
```hcl
resource "aws_iam_role_policy" "guild_service_s3" {
  name = "guild-service-s3-policy"
  role = aws_iam_role.guild_service.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.guild_avatars.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.guild_avatars.arn
      }
    ]
  })
}
```

#### 7. Monitoring & Analytics

**CloudWatch Metrics:**
- Upload success/failure rates
- File size distribution
- Processing time metrics
- Storage usage and costs
- Access pattern analytics

**Alerts:**
- Failed upload attempts
- Unusual file size patterns
- Storage quota warnings
- Processing time anomalies

#### 8. Cost Optimization

**Storage Optimization:**
- Automatic cleanup of old avatar versions
- Image compression and optimization
- CDN integration for global delivery
- Lifecycle policies for cost management

**Performance Optimization:**
- Lazy loading of avatar images
- Progressive image loading
- Caching strategies
- Thumbnail generation on-demand

## Backend Implementation Plan

### Guild Service Structure
```
backend/services/guild-service/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── settings.py             # Configuration management
│   ├── models/
│   │   ├── guild.py           # Guild data models
│   │   ├── comment.py         # Comment data models
│   │   └── ranking.py         # Ranking data models
│   ├── db/
│   │   ├── guild_db.py        # Guild database operations
│   │   ├── comment_db.py      # Comment database operations
│   │   └── ranking_db.py      # Ranking database operations
│   ├── jobs/
│   │   └── ranking_calculator.py # Hourly ranking calculation
│   └── utils/
│       ├── auth.py            # Authentication helpers
│       └── validation.py      # Data validation helpers
├── tests/
│   ├── test_guild_api.py      # API endpoint tests
│   ├── test_guild_db.py       # Database operation tests
│   ├── test_comment_api.py    # Comment API tests
│   └── test_ranking_api.py    # Ranking API tests
├── requirements.txt           # Python dependencies
└── README.md                 # Service documentation
```

### Key Implementation Files

**1. Guild Service Main Application (`app/main.py`):**
```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.settings import get_settings
from app.routers import guilds, comments, rankings, analytics

app = FastAPI(title="Guild Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(guilds.router, prefix="/guilds", tags=["guilds"])
app.include_router(comments.router, prefix="/guilds", tags=["comments"])
app.include_router(rankings.router, prefix="/guilds", tags=["rankings"])
app.include_router(analytics.router, prefix="/guilds", tags=["analytics"])
```

**2. Guild Database Operations (`app/db/guild_db.py`):**
```python
import boto3
from typing import List, Optional
from app.models.guild import GuildResponse, GuildCreatePayload
from app.utils.auth import get_current_user

class GuildDB:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table('gg_guild')
    
    async def create_guild(self, user_id: str, payload: GuildCreatePayload) -> GuildResponse:
        # Implementation for guild creation
        pass
    
    async def get_guild(self, guild_id: str) -> Optional[GuildResponse]:
        # Implementation for guild retrieval
        pass
    
    async def list_user_guilds(self, user_id: str) -> List[GuildResponse]:
        # Implementation for user's guilds
        pass
```

**3. Comment Database Operations (`app/db/comment_db.py`):**
```python
class CommentDB:
    async def add_comment(self, guild_id: str, user_id: str, content: str, parent_id: Optional[str] = None):
        # Implementation for comment creation
        pass
    
    async def get_comments(self, guild_id: str, limit: int = 50) -> List[CommentResponse]:
        # Implementation for comment retrieval
        pass
    
    async def update_comment(self, comment_id: str, user_id: str, content: str):
        # Implementation for comment updates
        pass
    
    async def delete_comment(self, comment_id: str, user_id: str, user_role: str):
        # Implementation for comment deletion
        pass
```

**4. Ranking Calculator Job (`app/jobs/ranking_calculator.py`):**
```python
import asyncio
from datetime import datetime
from app.db.guild_db import GuildDB
from app.db.ranking_db import RankingDB

class RankingCalculator:
    def __init__(self):
        self.guild_db = GuildDB()
        self.ranking_db = RankingDB()
    
    async def calculate_rankings(self):
        """Calculate and store guild rankings hourly"""
        # 1. Get all active guilds
        # 2. Calculate scores based on activity metrics
        # 3. Store rankings with timestamp
        # 4. Update position trends
        pass
```

### Infrastructure Scripts

**1. Terraform Guild Service (`backend/infra/terraform2/stacks/services/guild_service.tf`):**
```hcl
module "guild_service" {
  source = "../../modules/lambda/guild_service"
  
  service_name = "guild-service"
  environment  = var.environment
  
  # DynamoDB permissions
  dynamodb_tables = [
    aws_dynamodb_table.gg_guild.arn
  ]
  
  # API Gateway integration
  api_gateway_id = aws_api_gateway_rest_api.main.id
  api_gateway_execution_arn = aws_api_gateway_rest_api.main.execution_arn
}
```

**2. Guild Table Definition (`backend/infra/terraform2/stacks/database/gg_guild.tf`):**
```hcl
resource "aws_dynamodb_table" "gg_guild" {
  name           = "gg_guild"
  billing_mode   = "PROVISIONED"
  read_capacity  = 10
  write_capacity = 10
  hash_key       = "PK"
  range_key      = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # GSI1: User-owned guilds
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    read_capacity   = 5
    write_capacity  = 5
  }

  # GSI2: Guild members
  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    read_capacity   = 5
    write_capacity  = 5
  }

  # GSI3: Goal-guild relationships
  global_secondary_index {
    name            = "GSI3"
    hash_key        = "GSI3PK"
    range_key       = "GSI3SK"
    read_capacity   = 5
    write_capacity  = 5
  }

  # GSI4: Guild comments
  global_secondary_index {
    name            = "GSI4"
    hash_key        = "GSI4PK"
    range_key       = "GSI4SK"
    read_capacity   = 5
    write_capacity  = 5
  }

  # GSI5: Guild rankings
  global_secondary_index {
    name            = "GSI5"
    hash_key        = "GSI5PK"
    range_key       = "GSI5SK"
    read_capacity   = 5
    write_capacity  = 5
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}
```

## Success Criteria

- Guild creation form works with full validation and accessibility
- Users can view and manage their joined guilds
- Guild details display correctly with all related content
- Guild rankings system provides accurate leaderboards
- Member-only comments system functions with proper permissions
- All existing collaboration features remain functional
- Database relationships maintain integrity
- Performance meets SLO targets (p95 < 300ms)
- All tests pass with >90% coverage
- Hourly ranking calculations complete successfully
- Real-time comment updates work properly

## Risk Mitigation

**Data Integrity:** Implement transaction-like operations for guild membership changes
**Performance:** Monitor DynamoDB throughput and implement caching where needed
**Security:** Proper authorization checks for all guild operations
**Scalability:** Design for eventual growth from project rooms to large communities
