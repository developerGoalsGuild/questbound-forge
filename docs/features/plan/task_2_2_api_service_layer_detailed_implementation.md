# Task 2.2 - Quest API Service Layer - Detailed Implementation Plan

## Overview
Implement the frontend API service layer for quest operations, following the established patterns from `apiGoal.ts` and `apiHeader.ts`. This includes GraphQL operations for reading quests and REST API calls for writing operations, with comprehensive error handling, authentication, and logging.

## Current State Analysis
- ✅ Backend quest endpoints implemented in `backend/services/quest-service/app/main.py` (lines 1214-1504)
- ✅ GraphQL schema updated with `Quest` type and `myQuests` query
- ✅ Frontend quest models implemented in `frontend/src/models/quest.ts`
- ❌ **Missing**: Frontend API service layer (`frontend/src/lib/apiQuest.ts`)
- ❌ **Missing**: AppSync resolver for `myQuests` query
- ❌ **Missing**: API Gateway Terraform configuration for quest endpoints

## Implementation Strategy

### Phase 1: Core API Service Structure (Day 1)

#### 1.1 Create Base API Service File
**File**: `frontend/src/lib/apiQuest.ts`

**Dependencies**: 
- `frontend/src/lib/api.ts` (for `authFetch`, `graphqlRaw`)
- `frontend/src/lib/utils.ts` (for `getAccessToken`, `getApiBase`)
- `frontend/src/models/quest.ts` (for type definitions)

**Structure**:
```typescript
// Import patterns from existing apiGoal.ts
import { authFetch, graphqlRaw } from './api';
import { getAccessToken, getApiBase } from '@/lib/utils';
import type { 
  Quest, 
  QuestCreateInput, 
  QuestUpdateInput, 
  QuestCancelInput 
} from '@/models/quest';

// GraphQL Operations (Reads)
// REST Operations (Writes)
// Error Handling Utilities
// Type Definitions
```

#### 1.2 GraphQL Operations Implementation
**Pattern**: Follow `apiGoal.ts` GraphQL patterns

**Operations**:
1. **`myQuests(goalId?: string)`** - Query user's quests
   - Use existing `myQuests` query from GraphQL schema
   - Optional `goalId` parameter for filtering
   - Return `Quest[]` array

**Implementation**:
```typescript
const MY_QUESTS = /* GraphQL */ `
  query MyQuests($goalId: ID) {
    myQuests(goalId: $goalId) {
      id
      userId
      title
      description
      difficulty
      rewardXp
      status
      category
      tags
      privacy
      deadline
      createdAt
      updatedAt
      kind
      linkedGoalIds
      linkedTaskIds
      dependsOnQuestIds
      targetCount
      countScope
      startAt
      periodSeconds
    }
  }
`;

export async function loadQuests(goalId?: string): Promise<Quest[]> {
  // Implementation following apiGoal.ts patterns
}
```

#### 1.3 REST Operations Implementation
**Pattern**: Follow `apiGoal.ts` REST patterns with `authFetch`

**Operations**:
1. **`createQuest(payload: QuestCreateInput)`** - Create quest (draft)
2. **`startQuest(questId: string)`** - Start quest (draft → active)
3. **`editQuest(questId: string, payload: QuestUpdateInput)`** - Edit quest (draft only)
4. **`cancelQuest(questId: string, payload?: QuestCancelInput)`** - Cancel quest (active → cancelled)
5. **`failQuest(questId: string)`** - Mark quest as failed (active → failed)
6. **`deleteQuest(questId: string)`** - Delete quest (admin-only)

**Implementation Pattern**:
```typescript
export async function createQuest(payload: QuestCreateInput): Promise<Quest> {
  const response = await authFetch('/quests/createQuest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || 'Quest creation failed';
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorBody,
      url: '/quests/createQuest',
      input: payload,
      timestamp: new Date().toISOString()
    });
    throw new Error(message);
  }
  
  return response.json();
}
```

### Phase 2: Error Handling & Validation (Day 1)

#### 2.1 Comprehensive Error Handling
**Pattern**: Follow `apiHeader.ts` error handling patterns

**Error Types**:
- Network errors
- Authentication errors
- Validation errors
- Server errors
- Rate limiting errors

**Implementation**:
```typescript
interface QuestApiError {
  status: number;
  statusText: string;
  errorBody: any;
  url: string;
  input?: any;
  timestamp: string;
}

function handleQuestApiError(response: Response, url: string, input?: any): never {
  // Implementation following apiHeader.ts patterns
}
```

#### 2.2 Input Validation
**Pattern**: Use existing Zod schemas from `quest.ts`

**Validation**:
- Pre-API call validation using `QuestCreateInputSchema`
- Post-API call response validation
- Type safety throughout

**Implementation**:
```typescript
import { QuestCreateInputSchema, QuestUpdateInputSchema } from '@/models/quest';

export async function createQuest(payload: QuestCreateInput): Promise<Quest> {
  // Validate input before API call
  const validatedPayload = QuestCreateInputSchema.parse(payload);
  
  // Make API call
  const response = await authFetch('/quests/createQuest', {
    // ... implementation
  });
  
  // Validate response
  const quest = await response.json();
  return quest as Quest;
}
```

### Phase 3: Authentication & Security (Day 1)

#### 3.1 Authentication Headers
**Pattern**: Follow `apiHeader.ts` authentication patterns

**Headers**:
```typescript
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
  'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
  'x-request-id': generateRequestId(),
  'x-client-version': getClientVersion(),
};
```

#### 3.2 Token Management
**Pattern**: Use existing token management from `utils.ts`

**Implementation**:
- Automatic token refresh
- Token expiration handling
- Secure token storage

### Phase 4: Logging & Debugging (Day 1)

#### 4.1 Structured Logging
**Pattern**: Follow `apiGoal.ts` logging patterns

**Log Events**:
- API call start/success/failure
- Request/response details
- Error context
- Performance metrics

**Implementation**:
```typescript
function logQuestApiCall(operation: string, questId?: string, success: boolean, error?: any) {
  console.info(`[Quest API] ${operation}`, {
    questId,
    success,
    error: error?.message,
    timestamp: new Date().toISOString()
  });
}
```

#### 4.2 Debug Information
**Pattern**: Follow existing API patterns

**Debug Data**:
- Request URLs and parameters
- Response status and headers
- Error details and stack traces
- Performance timing

### Phase 5: Type Safety & Integration (Day 1)

#### 5.1 TypeScript Integration
**Pattern**: Follow `apiGoal.ts` type patterns

**Types**:
- Import all types from `quest.ts`
- Create API-specific response types
- Ensure type safety throughout

#### 5.2 API Response Mapping
**Pattern**: Follow `apiGoal.ts` response mapping

**Mapping**:
- GraphQL response to `Quest[]`
- REST response to `Quest`
- Error response to `QuestApiError`

### Phase 6: Testing & Validation (Day 1)

#### 6.1 Unit Tests
**File**: `frontend/src/lib/__tests__/apiQuest.test.ts`

**Test Coverage**:
- All API functions
- Error handling scenarios
- Input validation
- Response mapping

**Test Pattern**: Follow `apiGoal.test.ts` patterns

#### 6.2 Integration Tests
**File**: `frontend/src/lib/__tests__/apiQuest.integration.test.ts`

**Test Scenarios**:
- End-to-end API calls
- Authentication flows
- Error recovery
- Network failure handling

### Phase 7: AppSync Resolver Implementation (Day 1)

#### 7.1 Create AppSync Resolver for myQuests Query
**File**: `backend/infra/terraform2/resolvers/myQuests.vtl`

**Pattern**: Follow existing resolver patterns in `backend/infra/terraform2/resolvers/`

**Implementation**:
```vtl
## myQuests Resolver - Query user's quests
## Input: { "userId": "string", "goalId": "string" (optional) }
## Output: Quest[] array

# Set up variables
#set($userId = $context.identity.resolverContext.sub)
#set($goalId = $context.arguments.goalId)

# Build query parameters
#set($queryParams = {
  "KeyConditionExpression": "PK = :pk AND begins_with(SK, :sk_prefix)",
  "ExpressionAttributeValues": {
    ":pk": {"S": "USER#$userId"},
    ":sk_prefix": {"S": "QUEST#"}
  }
})

# Add filter for goalId if provided
#if($goalId)
  #set($queryParams.FilterExpression = "contains(linkedGoalIds, :goalId)")
  #set($queryParams.ExpressionAttributeValues[":goalId"] = {"S": "$goalId"})
#end

# Execute query
{
  "version": "2017-02-28",
  "operation": "Query",
  "query": $util.toJson($queryParams)
}
```

#### 7.2 Update Terraform Resolver Configuration
**File**: `backend/infra/terraform2/appsync.tf`

**Add resolver resource**:
```hcl
resource "aws_appsync_resolver" "myQuests" {
  api_id      = aws_appsync_graphql_api.goalsguild.id
  type        = "Query"
  field       = "myQuests"
  data_source = aws_appsync_datasource.dynamodb.name

  request_template = file("${path.module}/resolvers/myQuests.vtl")
  response_template = file("${path.module}/resolvers/common/response.vtl")

  depends_on = [aws_appsync_datasource.dynamodb]
}
```

### Phase 8: API Gateway Terraform Configuration (Day 1)

#### 8.1 Update API Gateway Resources
**File**: `backend/infra/terraform2/api_gateway.tf`

**Add quest endpoints**:
```hcl
# Quest endpoints
resource "aws_api_gateway_resource" "quests" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  parent_id   = aws_api_gateway_rest_api.goalsguild.root_resource_id
  path_part   = "quests"
}

# Create Quest endpoint
resource "aws_api_gateway_resource" "create_quest" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  parent_id   = aws_api_gateway_resource.quests.id
  path_part   = "createQuest"
}

resource "aws_api_gateway_method" "create_quest" {
  rest_api_id   = aws_api_gateway_rest_api.goalsguild.id
  resource_id   = aws_api_gateway_resource.create_quest.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "create_quest" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  resource_id = aws_api_gateway_resource.create_quest.id
  http_method = aws_api_gateway_method.create_quest.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.quest_service.invoke_arn
}

# Quest management endpoints
resource "aws_api_gateway_resource" "quest_management" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  parent_id   = aws_api_gateway_resource.quests.id
  path_part   = "quests"
}

resource "aws_api_gateway_resource" "quest_by_id" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  parent_id   = aws_api_gateway_resource.quest_management.id
  path_part   = "{id}"
}

# Start Quest endpoint
resource "aws_api_gateway_resource" "start_quest" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  parent_id   = aws_api_gateway_resource.quest_by_id.id
  path_part   = "start"
}

resource "aws_api_gateway_method" "start_quest" {
  rest_api_id   = aws_api_gateway_rest_api.goalsguild.id
  resource_id   = aws_api_gateway_resource.start_quest.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "start_quest" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  resource_id = aws_api_gateway_resource.start_quest.id
  http_method = aws_api_gateway_method.start_quest.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.quest_service.invoke_arn
}

# Edit Quest endpoint
resource "aws_api_gateway_method" "edit_quest" {
  rest_api_id   = aws_api_gateway_rest_api.goalsguild.id
  resource_id   = aws_api_gateway_resource.quest_by_id.id
  http_method   = "PUT"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "edit_quest" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  resource_id = aws_api_gateway_resource.quest_by_id.id
  http_method = aws_api_gateway_method.edit_quest.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.quest_service.invoke_arn
}

# Cancel Quest endpoint
resource "aws_api_gateway_resource" "cancel_quest" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  parent_id   = aws_api_gateway_resource.quest_by_id.id
  path_part   = "cancel"
}

resource "aws_api_gateway_method" "cancel_quest" {
  rest_api_id   = aws_api_gateway_rest_api.goalsguild.id
  resource_id   = aws_api_gateway_resource.cancel_quest.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "cancel_quest" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  resource_id = aws_api_gateway_resource.cancel_quest.id
  http_method = aws_api_gateway_method.cancel_quest.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.quest_service.invoke_arn
}

# Fail Quest endpoint
resource "aws_api_gateway_resource" "fail_quest" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  parent_id   = aws_api_gateway_resource.quest_by_id.id
  path_part   = "fail"
}

resource "aws_api_gateway_method" "fail_quest" {
  rest_api_id   = aws_api_gateway_rest_api.goalsguild.id
  resource_id   = aws_api_gateway_resource.fail_quest.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "fail_quest" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  resource_id = aws_api_gateway_resource.fail_quest.id
  http_method = aws_api_gateway_method.fail_quest.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.quest_service.invoke_arn
}

# Delete Quest endpoint
resource "aws_api_gateway_method" "delete_quest" {
  rest_api_id   = aws_api_gateway_rest_api.goalsguild.id
  resource_id   = aws_api_gateway_resource.quest_by_id.id
  http_method   = "DELETE"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.lambda_authorizer.id
}

resource "aws_api_gateway_integration" "delete_quest" {
  rest_api_id = aws_api_gateway_rest_api.goalsguild.id
  resource_id = aws_api_gateway_resource.quest_by_id.id
  http_method = aws_api_gateway_method.delete_quest.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.quest_service.invoke_arn
}
```

#### 8.2 Update Lambda Function Permissions
**File**: `backend/infra/terraform2/iam.tf`

**Add quest service permissions**:
```hcl
# Quest Service Lambda permissions
resource "aws_lambda_permission" "quest_service_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.quest_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.goalsguild.execution_arn}/*/*"
}

# Quest Service DynamoDB permissions
resource "aws_iam_role_policy" "quest_service_dynamodb" {
  name = "quest-service-dynamodb-policy"
  role = aws_iam_role.quest_service_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.gg_core.arn,
          "${aws_dynamodb_table.gg_core.arn}/index/*"
        ]
      }
    ]
  })
}
```

### Phase 9: Documentation & Examples (Day 1)

#### 9.1 JSDoc Documentation
**Pattern**: Follow `apiGoal.ts` documentation

**Documentation**:
- Function descriptions
- Parameter documentation
- Return type documentation
- Error scenarios
- Usage examples

#### 9.2 Usage Examples
**Pattern**: Follow existing API patterns

**Examples**:
- Basic quest operations
- Error handling
- Authentication
- Type usage

## File Structure

```
frontend/src/lib/
├── apiQuest.ts                    # Main API service file
├── __tests__/
│   ├── apiQuest.test.ts          # Unit tests
│   └── apiQuest.integration.test.ts # Integration tests
└── api.ts                        # Existing base API utilities
```

## Dependencies

### Internal Dependencies
- `frontend/src/lib/api.ts` - Base API utilities
- `frontend/src/lib/utils.ts` - Utility functions
- `frontend/src/models/quest.ts` - Quest type definitions
- `frontend/src/graphql/queries.ts` - GraphQL queries (to be created)

### External Dependencies
- `aws-amplify/api` - GraphQL client
- `zod` - Input validation
- `@apollo/client` - GraphQL operations

## API Endpoints Mapping

### GraphQL Operations (Reads)
| Operation | Endpoint | Method | Auth | Description |
|-----------|----------|--------|------|-------------|
| `myQuests` | GraphQL | Query | Lambda | Get user's quests |

### REST Operations (Writes)
| Operation | Endpoint | Method | Auth | Description |
|-----------|----------|--------|------|-------------|
| `createQuest` | `/quests/createQuest` | POST | Lambda | Create quest (draft) |
| `startQuest` | `/quests/quests/{id}/start` | POST | Lambda | Start quest (draft → active) |
| `editQuest` | `/quests/quests/{id}` | PUT | Lambda | Edit quest (draft only) |
| `cancelQuest` | `/quests/quests/{id}/cancel` | POST | Lambda | Cancel quest (active → cancelled) |
| `failQuest` | `/quests/quests/{id}/fail` | POST | Lambda | Mark quest as failed (active → failed) |
| `deleteQuest` | `/quests/quests/{id}` | DELETE | Lambda | Delete quest (admin-only) |

## Error Handling Strategy

### Error Types
1. **Network Errors** - Connection failures, timeouts
2. **Authentication Errors** - Invalid tokens, expired tokens
3. **Validation Errors** - Invalid input data
4. **Server Errors** - Backend processing failures
5. **Rate Limiting Errors** - Too many requests
6. **Permission Errors** - Insufficient permissions

### Error Recovery
1. **Automatic Retry** - For network errors
2. **Token Refresh** - For authentication errors
3. **User Notification** - For validation errors
4. **Fallback Behavior** - For server errors

## Security Considerations

### Input Validation
- Server-side validation (primary)
- Client-side validation (UX)
- XSS protection
- SQL injection prevention

### Authentication
- JWT token validation
- Token refresh handling
- Secure token storage
- Session management

### Data Protection
- Sensitive data redaction
- Audit trail logging
- Request tracing
- Error information sanitization

## Performance Considerations

### Caching
- Quest data caching
- Response caching
- Token caching

### Optimization
- Request batching
- Response compression
- Lazy loading
- Pagination support

### Monitoring
- API call timing
- Error rates
- Success rates
- Performance metrics

## Testing Strategy

### Unit Tests
- Individual function testing
- Mock API responses
- Error scenario testing
- Input validation testing

### Integration Tests
- End-to-end API testing
- Authentication flow testing
- Error recovery testing
- Performance testing

### E2E Tests
- User workflow testing
- Cross-browser testing
- Mobile testing
- Accessibility testing

## TASK COMPLETION CHECKLIST

### ✅ **Phase 1: Frontend API Service Layer**
- [ ] **1.1** Create `frontend/src/lib/apiQuest.ts` file
- [ ] **1.2** Implement GraphQL `loadQuests(goalId?: string)` operation
- [ ] **1.3** Implement REST `createQuest(payload: QuestCreateInput)` operation
- [ ] **1.4** Implement REST `startQuest(questId: string)` operation
- [ ] **1.5** Implement REST `editQuest(questId: string, payload: QuestUpdateInput)` operation
- [ ] **1.6** Implement REST `cancelQuest(questId: string, payload?: QuestCancelInput)` operation
- [ ] **1.7** Implement REST `failQuest(questId: string)` operation
- [ ] **1.8** Implement REST `deleteQuest(questId: string)` operation

### ✅ **Phase 2: Error Handling & Validation**
- [ ] **2.1** Implement comprehensive error handling following `apiHeader.ts` patterns
- [ ] **2.2** Add input validation using Zod schemas from `quest.ts`
- [ ] **2.3** Add response validation and type safety
- [ ] **2.4** Add error recovery mechanisms (retry, token refresh)
- [ ] **2.5** Add structured error logging with context

### ✅ **Phase 3: Authentication & Security**
- [ ] **3.1** Implement authentication headers (Bearer token + API key)
- [ ] **3.2** Add token management (refresh, expiration handling)
- [ ] **3.3** Add security measures (XSS protection, input sanitization)
- [ ] **3.4** Add permission checks and role validation
- [ ] **3.5** Add request ID generation and tracing

### ✅ **Phase 4: Logging & Debugging**
- [ ] **4.1** Add structured logging for all API operations
- [ ] **4.2** Add debug information (request/response details)
- [ ] **4.3** Add performance monitoring and timing
- [ ] **4.4** Add error tracking and reporting

### ✅ **Phase 5: Type Safety & Integration**
- [ ] **5.1** Ensure full TypeScript integration with `quest.ts` models
- [ ] **5.2** Add type safety throughout all API functions
- [ ] **5.3** Add API response mapping to Quest interfaces
- [ ] **5.4** Add type validation for inputs and outputs

### ✅ **Phase 6: Testing**
- [ ] **6.1** Create `frontend/src/lib/__tests__/apiQuest.test.ts` unit tests
- [ ] **6.2** Create `frontend/src/lib/__tests__/apiQuest.integration.test.ts` integration tests
- [ ] **6.3** Add error scenario tests (network failures, auth errors, validation errors)
- [ ] **6.4** Add performance tests and load testing
- [ ] **6.5** Ensure >90% test coverage

### ✅ **Phase 7: AppSync Resolver Implementation**
- [ ] **7.1** Create `backend/infra/terraform2/resolvers/myQuests.vtl` resolver
- [ ] **7.2** Update `backend/infra/terraform2/appsync.tf` with myQuests resolver
- [ ] **7.3** Test AppSync resolver with DynamoDB queries
- [ ] **7.4** Verify resolver handles optional goalId filtering

### ✅ **Phase 8: API Gateway Terraform Configuration**
- [ ] **8.1** Update `backend/infra/terraform2/api_gateway.tf` with quest endpoints
- [ ] **8.2** Add `/quests/createQuest` POST endpoint
- [ ] **8.3** Add `/quests/quests/{id}/start` POST endpoint
- [ ] **8.4** Add `/quests/quests/{id}` PUT endpoint (edit)
- [ ] **8.5** Add `/quests/quests/{id}/cancel` POST endpoint
- [ ] **8.6** Add `/quests/quests/{id}/fail` POST endpoint
- [ ] **8.7** Add `/quests/quests/{id}` DELETE endpoint
- [ ] **8.8** Update `backend/infra/terraform2/iam.tf` with quest service permissions
- [ ] **8.9** Add Lambda function permissions for API Gateway
- [ ] **8.10** Add DynamoDB permissions for quest operations

### ✅ **Phase 9: Documentation & Examples**
- [ ] **9.1** Add comprehensive JSDoc documentation for all functions
- [ ] **9.2** Add parameter documentation and return type descriptions
- [ ] **9.3** Add error scenario documentation
- [ ] **9.4** Add usage examples and code samples
- [ ] **9.5** Add API reference documentation

### ✅ **Phase 10: Integration & Validation**
- [ ] **10.1** Test GraphQL `myQuests` query integration
- [ ] **10.2** Test all REST API endpoints with real backend
- [ ] **10.3** Verify authentication flow works correctly
- [ ] **10.4** Test error handling and recovery scenarios
- [ ] **10.5** Verify type safety throughout the application

### ✅ **Phase 11: Performance & Optimization**
- [ ] **11.1** Test API response times (< 2 seconds for all operations)
- [ ] **11.2** Verify error handling doesn't impact performance
- [ ] **11.3** Test with concurrent requests
- [ ] **11.4** Optimize any performance bottlenecks

### ✅ **Phase 12: Security & Compliance**
- [ ] **12.1** Verify all inputs are properly validated and sanitized
- [ ] **12.2** Test XSS protection and injection prevention
- [ ] **12.3** Verify authentication and authorization work correctly
- [ ] **12.4** Test rate limiting and security headers
- [ ] **12.5** Verify audit logging is working

### ✅ **Phase 13: Final Validation**
- [ ] **13.1** Run all tests and ensure they pass
- [ ] **13.2** Verify no linting errors
- [ ] **13.3** Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] **13.4** Test on mobile devices
- [ ] **13.5** Verify accessibility compliance
- [ ] **13.6** Test with different user roles and permissions

### ✅ **Phase 14: Deployment & Infrastructure**
- [ ] **14.1** Deploy Terraform changes to staging environment
- [ ] **14.2** Test all endpoints in staging
- [ ] **14.3** Verify AppSync resolver works in staging
- [ ] **14.4** Test API Gateway integration in staging
- [ ] **14.5** Deploy to production environment
- [ ] **14.6** Verify production deployment works correctly

### ✅ **Phase 15: Monitoring & Maintenance**
- [ ] **15.1** Set up CloudWatch monitoring for quest operations
- [ ] **15.2** Set up error alerting and notifications
- [ ] **15.3** Monitor API performance and response times
- [ ] **15.4** Set up log aggregation and analysis
- [ ] **15.5** Create runbook for quest API maintenance

## **CRITICAL SUCCESS CRITERIA**

### **Functional Requirements**
- [ ] **F1** All 6 quest operations (create, start, edit, cancel, fail, delete) work correctly
- [ ] **F2** GraphQL `myQuests` query returns user's quests with optional goalId filtering
- [ ] **F3** All API calls include proper authentication headers
- [ ] **F4** Error handling works for all error scenarios (network, auth, validation, server)
- [ ] **F5** Input validation prevents invalid data from reaching backend
- [ ] **F6** Type safety maintained throughout the application

### **Non-Functional Requirements**
- [ ] **NF1** API response times < 2 seconds for all operations
- [ ] **NF2** Error recovery works automatically (token refresh, retry)
- [ ] **NF3** Security measures implemented (XSS protection, input sanitization)
- [ ] **NF4** Test coverage > 90%
- [ ] **NF5** No breaking changes to existing functions

### **Quality Requirements**
- [ ] **Q1** Code follows existing patterns from `apiGoal.ts` and `apiHeader.ts`
- [ ] **Q2** All functions have comprehensive JSDoc documentation
- [ ] **Q3** Error messages are user-friendly and actionable
- [ ] **Q4** Logging provides sufficient context for debugging
- [ ] **Q5** Code is maintainable and follows SOLID principles

### **Infrastructure Requirements**
- [ ] **I1** AppSync resolver deployed and working
- [ ] **I2** API Gateway endpoints deployed and accessible
- [ ] **I3** Lambda function permissions configured correctly
- [ ] **I4** DynamoDB permissions configured correctly
- [ ] **I5** All infrastructure changes deployed to production

## **FINAL VALIDATION CHECKLIST**

### **Before Marking Task Complete**
- [ ] **V1** All 15 phases completed (75+ individual tasks)
- [ ] **V2** All critical success criteria met (20+ criteria)
- [ ] **V3** All tests passing (unit, integration, E2E)
- [ ] **V4** No linting errors or warnings
- [ ] **V5** Documentation complete and up-to-date
- [ ] **V6** Infrastructure deployed and tested
- [ ] **V7** Performance requirements met
- [ ] **V8** Security requirements met
- [ ] **V9** Code review completed and approved
- [ ] **V10** Production deployment verified

### **Sign-off Requirements**
- [ ] **S1** Developer self-review completed
- [ ] **S2** Code review by senior developer
- [ ] **S3** QA testing completed and passed
- [ ] **S4** Security review completed
- [ ] **S5** Performance review completed
- [ ] **S6** Infrastructure review completed
- [ ] **S7** Documentation review completed
- [ ] **S8** Final approval from project lead

---

## **TASK COMPLETION STATUS**

**Total Tasks**: 75+ individual tasks across 15 phases
**Completed**: 0/75+ (0%)
**Remaining**: 75+ tasks
**Estimated Time**: 8 hours
**Priority**: High
**Status**: Ready to start

**Next Steps**:
1. Begin with Phase 1: Frontend API Service Layer
2. Follow the implementation order strictly
3. Check off each task as completed
4. Validate each phase before moving to the next
5. Complete final validation checklist before marking task complete
