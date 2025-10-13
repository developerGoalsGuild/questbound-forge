# Guild Features Implementation Plan (Tasks 20.1-20.3)

## Description

Implement guild (persistent community) features allowing users to create guilds that can contain multiple goals/quests. Guilds are social communities where users can collaborate on multiple related objectives. This includes frontend forms for guild creation, listing joined guilds, and displaying guild details.

**Key Requirements:**
- Guilds are persistent communities (not temporary project rooms)
- Guilds can contain multiple goals/quests
- Goals/quests can belong to multiple guilds
- Integrate with existing collaboration service
- Use separate `gg_guild` DynamoDB table with relationships to `gg_core` table

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

## Technical Implementation Plan

### Phase 1: Database Schema Design & Guild Service Extension

#### 1.1 Create gg_guild DynamoDB Table
**Files to create/modify:**
- `backend/infra/terraform2/stacks/database/main.tf` - Add gg_guild table definition
- `backend/infra/terraform2/modules/dynamodb/main.tf` - Add guild table module

**Table Design:**
```
Table: gg_guild
Primary Key:
- PK: GUILD#{guildId}
- SK: METADATA#{guildId} | MEMBER#{userId} | GOAL#{goalId} | QUEST#{questId}

Global Secondary Indexes:
- GSI1: User-owned guilds (GSI1PK=USER#{userId}, GSI1SK=GUILD#{guildId})
- GSI2: Guild members lookup (GSI2PK=GUILD#{guildId}, GSI2SK=MEMBER#{userId})
- GSI3: Goal-guild relationships (GSI3PK=GOAL#{goalId}, GSI3SK=GUILD#{guildId})
```

**Algorithm for Guild-Metadata Item:**
```
PK: GUILD#{guildId}
SK: METADATA#{guildId}
Attributes:
- guildId, name, description, createdBy, createdAt, updatedAt
- memberCount, goalCount, questCount, isPublic
- tags[], settings{allowJoinRequests, requireApproval}
```

#### 1.2 Extend Collaboration Service Models
**Files to create/modify:**
- `backend/services/collaboration-service/app/models/guild.py` - New guild models
- `backend/services/collaboration-service/app/db/guild_db.py` - Guild database operations
- `backend/services/collaboration-service/app/main.py` - Add guild endpoints

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
```

#### 1.3 Guild Database Operations
**Key Operations Algorithm:**
1. **Create Guild**: Insert METADATA and MEMBER items, verify creator ownership
2. **Join Guild**: Add MEMBER item, increment counters, check permissions
3. **Leave Guild**: Remove MEMBER item, decrement counters, transfer ownership if needed
4. **Add Goal/Quest**: Add GOAL/QUEST item, increment counters, verify permissions
5. **Remove Goal/Quest**: Remove item, decrement counters, verify ownership

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

#### 2.1 Guild API Endpoints
**New API Routes:**
```
POST   /collaborations/guilds                    - Create guild
GET    /collaborations/guilds                    - List user's guilds
GET    /collaborations/guilds/{guild_id}         - Get guild details
PUT    /collaborations/guilds/{guild_id}         - Update guild
DELETE /collaborations/guilds/{guild_id}         - Delete guild (owner only)

POST   /collaborations/guilds/{guild_id}/join     - Join guild
POST   /collaborations/guilds/{guild_id}/leave    - Leave guild
GET    /collaborations/guilds/{guild_id}/members  - List guild members

POST   /collaborations/guilds/{guild_id}/goals/{goal_id}     - Add goal to guild
DELETE /collaborations/guilds/{guild_id}/goals/{goal_id}     - Remove goal from guild
POST   /collaborations/guilds/{guild_id}/quests/{quest_id}   - Add quest to guild
DELETE /collaborations/guilds/{guild_id}/quests/{quest_id}   - Remove quest from guild
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

#### 3.1 Guild API Client
**Files to create/modify:**
- `frontend/src/lib/api/guild.ts` - Guild-specific API functions
- `frontend/src/lib/api/collaborations.ts` - Extend with guild operations

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

#### 5.1 Terraform Updates
**Files to modify:**
- `backend/infra/terraform2/stacks/database/main.tf` - Add gg_guild table
- `backend/infra/terraform2/modules/dynamodb/main.tf` - Add guild table configuration
- `backend/infra/terraform2/modules/apigateway/api_gateway.tf` - Add guild API routes

**Infrastructure Changes:**
- New DynamoDB table with provisioned throughput
- Additional API Gateway resources and methods
- CloudWatch alarms for guild operations
- IAM permissions for Lambda to access gg_guild table

#### 5.2 Environment Configuration
**SSM Parameters:**
- Guild table name and configuration
- Guild-related feature flags
- Rate limiting for guild operations

#### 5.3 Deployment Plan
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
- [ ] **Database Schema**
  - [ ] `gg_guild` table created with correct key structure (PK/SK)
  - [ ] GSI1, GSI2, GSI3 indexes configured for user-guild, member, and goal relationships
  - [ ] Table provisioned with appropriate RCU/WCU settings
  - [ ] DynamoDB table policies updated for Lambda access

- [ ] **Collaboration Service Extension**
  - [ ] `app/models/guild.py` created with GuildCreatePayload, GuildResponse, GuildMember models
  - [ ] `app/db/guild_db.py` created with all CRUD operations
  - [ ] Guild endpoints added to `app/main.py` with proper FastAPI routing
  - [ ] Authentication middleware integrated for all guild operations
  - [ ] CORS configuration updated for frontend access
  - [ ] Error handling implemented with proper HTTP status codes

- [ ] **API Gateway Integration**
  - [ ] New guild routes added to API Gateway configuration
  - [ ] Lambda permissions updated for gg_guild table access
  - [ ] Request/response mapping templates configured
  - [ ] API documentation updated with OpenAPI specs

- [ ] **GraphQL Schema Updates**
  - [ ] Guild types added to `schema.graphql`
  - [ ] Query and Mutation operations defined
  - [ ] AppSync resolvers created for guild operations
  - [ ] Lambda authorizer configured for GraphQL operations

### Frontend Development ✅
- [ ] **API Integration**
  - [ ] `src/lib/api/guild.ts` created with all guild API functions
  - [ ] `src/lib/api/collaborations.ts` extended with guild operations
  - [ ] Error handling and retry logic implemented
  - [ ] TypeScript interfaces defined for all guild data structures

- [ ] **Guild Creation Form (Task 20.1)**
  - [ ] `GuildCreationForm.tsx` component created with proper validation
  - [ ] Zod schema implemented for form validation
  - [ ] React Hook Form integration with proper error states
  - [ ] Accessibility features: ARIA labels, keyboard navigation, screen reader support
  - [ ] Loading states and error recovery implemented
  - [ ] Mobile-first responsive design with Tailwind CSS

- [ ] **Joined Guilds List (Task 20.2)**
  - [ ] `GuildsList.tsx` component with grid/list view options
  - [ ] `GuildCard.tsx` component for individual guild display
  - [ ] Search and filter functionality by tags and name
  - [ ] Sorting options (creation date, member count, activity)
  - [ ] Empty state with call-to-action for creating first guild
  - [ ] Loading skeleton components for better UX

- [ ] **Guild Details Display (Task 20.3)**
  - [ ] `GuildDetails.tsx` main component with guild header
  - [ ] `GuildMembers.tsx` for member listing and management
  - [ ] `GuildGoals.tsx` and `GuildQuests.tsx` for content display
  - [ ] Join/Leave functionality with proper state management
  - [ ] Owner-only settings and management options
  - [ ] Breadcrumb navigation and responsive layout

- [ ] **Internationalization**
  - [ ] `src/i18n/guild.ts` created with translations for en/es/fr
  - [ ] Form labels, validation messages, and UI text translated
  - [ ] Error messages and success notifications localized
  - [ ] Date formatting and number localization implemented

### Testing & Quality Assurance ✅
- [ ] **Unit Tests**
  - [ ] Backend: >90% coverage for guild_db.py and guild API endpoints
  - [ ] Frontend: Component tests for all React components
  - [ ] API integration tests for all guild operations
  - [ ] Edge cases and error scenarios covered

- [ ] **Integration Tests**
  - [ ] End-to-end guild creation and management workflows
  - [ ] Cross-table relationship integrity validation
  - [ ] Permission and authorization testing
  - [ ] Concurrent operation handling

- [ ] **Selenium Automation**
  - [ ] `tests/seleniumGuildTests.js` created with comprehensive scenarios
  - [ ] `scripts/run-guild-creation-tests.ps1` and `scripts/run-guild-management-tests.ps1` implemented
  - [ ] Cross-browser compatibility verified
  - [ ] Performance benchmarks established

- [ ] **Accessibility Testing**
  - [ ] Screen reader compatibility verified
  - [ ] Keyboard navigation tested
  - [ ] Color contrast and visual indicators compliant
  - [ ] Focus management implemented and tested

- [ ] **Security Testing**
  - [ ] Input validation and sanitization verified
  - [ ] Authorization checks for all operations
  - [ ] SQL injection and XSS prevention confirmed
  - [ ] Rate limiting and abuse prevention implemented

### Infrastructure & Deployment ✅
- [ ] **Terraform Scripts Update**
  - [ ] Create `backend/infra/terraform2/stacks/database/gg_guild.tf` for new table
  - [ ] Update `backend/infra/terraform2/stacks/services/collaboration_service.tf` for new endpoints
  - [ ] Add GraphQL resolvers in `backend/infra/terraform2/resolvers/guilds/`
  - [ ] Update API Gateway configuration with guild routes
  - [ ] Add CloudWatch alarms for guild operations
  - [ ] Validate terraform plans and apply to dev environment
- [ ] **Terraform Configuration**
  - [ ] Database module updated with gg_guild table
  - [ ] API Gateway module extended with guild routes
  - [ ] Lambda module updated with new permissions
  - [ ] All terraform plans validated and documented

- [ ] **Environment Setup**
  - [ ] SSM parameters configured for all environments (dev/staging/prod)
  - [ ] Environment variables documented and validated
  - [ ] Feature flags implemented for gradual rollout

- [ ] **Monitoring & Observability**
  - [ ] CloudWatch alarms configured for guild operations
  - [ ] X-Ray tracing enabled for performance monitoring
  - [ ] Structured logging implemented throughout
  - [ ] Error tracking and alerting configured

### Documentation & Compliance ✅
- [ ] **Database Documentation**
  - [ ] `docs/dynamodb_single_table_model.md` updated with gg_guild schema
  - [ ] Relationship patterns between gg_core and gg_guild documented
  - [ ] Access patterns and query examples added

- [ ] **API Documentation**
  - [ ] OpenAPI specifications updated
  - [ ] GraphQL schema documentation completed
  - [ ] API usage examples and error codes documented

- [ ] **Code Documentation**
  - [ ] All new functions and classes documented
  - [ ] Complex algorithms explained with comments
  - [ ] TypeScript interfaces and props documented

- [ ] **User Documentation**
  - [ ] Guild creation and management guides
  - [ ] Troubleshooting documentation for common issues
  - [ ] Accessibility features documented

### Performance & Scalability ✅
- [ ] **Database Performance**
  - [ ] Query patterns optimized for low latency
  - [ ] GSI usage optimized for common access patterns
  - [ ] Read/write capacity properly provisioned

- [ ] **API Performance**
  - [ ] Response times meet SLO targets (p95 < 300ms)
  - [ ] Efficient data fetching and pagination implemented
  - [ ] Caching strategies applied where appropriate

- [ ] **Frontend Performance**
  - [ ] Core Web Vitals optimized (LCP, CLS, FID)
  - [ ] Lazy loading implemented for large lists
  - [ ] Memory leaks prevented in React components

### Compliance & Security ✅
- [ ] **Data Privacy**
  - [ ] GDPR compliance for user data handling
  - [ ] Proper data retention policies implemented
  - [ ] User consent mechanisms for data sharing

- [ ] **Security Standards**
  - [ ] OWASP security guidelines followed
  - [ ] Input validation and output encoding implemented
  - [ ] Secure communication protocols used (HTTPS/TLS)

- [ ] **Accessibility Compliance**
  - [ ] WCAG 2.1 AA standards met
  - [ ] Screen reader compatibility verified
  - [ ] Keyboard accessibility fully implemented

### Final Validation ✅
- [ ] **Cross-Browser Testing**
  - [ ] Chrome, Firefox, Safari, Edge compatibility verified
  - [ ] Mobile browsers tested (iOS Safari, Chrome Mobile)
  - [ ] Responsive design validated across breakpoints

- [ ] **Load Testing**
  - [ ] Performance under load validated
  - [ ] Database throughput tested under concurrent users
  - [ ] API rate limiting and throttling verified

- [ ] **Production Readiness**
  - [ ] All tests passing in CI/CD pipeline
  - [ ] Rollback procedures documented and tested
  - [ ] Monitoring dashboards configured and validated
  - [ ] Incident response procedures established

- [ ] **Stakeholder Approval**
  - [ ] Product requirements validated against implementation
  - [ ] UX/UI design specifications met
  - [ ] Accessibility requirements fulfilled
  - [ ] Performance benchmarks achieved

### Deployment Readiness ✅
- [ ] **Environment Validation**
  - [ ] Dev environment fully tested and stable
  - [ ] Staging environment configured and validated
  - [ ] Production environment ready for deployment

- [ ] **Data Migration**
  - [ ] Migration scripts tested and validated
  - [ ] Backwards compatibility confirmed
  - [ ] Rollback procedures documented

- [ ] **Go-Live Checklist**
  - [ ] Feature flags configured for controlled rollout
  - [ ] Monitoring alerts active and tested
  - [ ] Support team trained on new features
  - [ ] User communication prepared

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

## Success Criteria

- Guild creation form works with full validation and accessibility
- Users can view and manage their joined guilds
- Guild details display correctly with all related content
- All existing collaboration features remain functional
- Database relationships maintain integrity
- Performance meets SLO targets (p95 < 300ms)
- All tests pass with >90% coverage

## Risk Mitigation

**Data Integrity:** Implement transaction-like operations for guild membership changes
**Performance:** Monitor DynamoDB throughput and implement caching where needed
**Security:** Proper authorization checks for all guild operations
**Scalability:** Design for eventual growth from project rooms to large communities
