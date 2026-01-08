# Milestone Schema Backend - Technical Plan

## Brief Description

This plan implements minimal milestone schema infrastructure in the backend while maintaining the current dynamic calculation behavior. The feature adds basic DynamoDB schema documentation for future milestone storage, updates the GraphQL schema to support read-only milestone queries, and ensures the goal API returns milestone data as part of progress endpoints. No persistent storage is implemented - milestones remain calculated dynamically until feature 17.4.

## Current State Analysis

The system currently has:
- **GraphQL Schema**: Already includes `Milestone` type and `milestones` field in `Goal` type (lines 95-102, 77 in schema.graphql)
- **Progress Calculation**: Milestones are calculated dynamically in `calculate_milestones()` function (lines 1087-1130 in main.py)
- **DynamoDB Storage**: Milestones are stored as JSON arrays in the Goal record's `milestones` field
- **API Endpoints**: Progress endpoints exist and milestones are calculated on-the-fly

## Required Changes

### Phase 1: Schema Documentation Only

#### 1.1 Update DynamoDB Single-Table Schema Documentation
**Files to modify:**
- `docs/dynamodb_single_table_model.md`

**Changes:**
- Add Milestone entity pattern documentation for future reference
- Define milestone access patterns for GSI1 (user-owned listings)
- Document the schema structure without implementing storage

**Milestone Entity Pattern (Documentation Only):**
```
PK: USER#<userId>
SK: MILESTONE#<goalId>#<milestoneId>
GSI1PK: USER#<userId>
GSI1SK: ENTITY#Milestone#<createdAtISO>
```

#### 1.2 No Terraform Infrastructure Changes
**Files to modify:**
- None - no infrastructure changes needed

**Changes:**
- No new GSI attributes needed
- No new DynamoDB table changes
- Current infrastructure supports future milestone storage

### Phase 2: Minimal Backend Updates

#### 2.1 No Quest Service Model Changes
**Files to modify:**
- None - keep existing models

**Changes:**
- Keep existing `Milestone` model as-is
- No new input/update models needed
- Current `GoalResponse` already includes milestone information

#### 2.2 No New Data Access Layer
**Files to create/modify:**
- None - no new service files

**Changes:**
- Keep existing dynamic milestone calculation
- No persistent storage implementation
- Current `calculate_milestones()` function remains unchanged

#### 2.3 No New API Endpoints
**Files to modify:**
- None - no new endpoints needed

**Changes:**
- Keep existing progress endpoints
- Milestone data returned as part of progress responses
- No separate milestone CRUD endpoints

#### 2.4 Keep Current Progress Calculation Logic
**Files to modify:**
- None - no changes to calculation logic

**Changes:**
- Keep existing `calculate_milestones()` function as-is
- Keep existing `compute_goal_progress()` function as-is
- No persistent milestone storage or synchronization

### Phase 3: GraphQL Schema Updates (Read-Only)

#### 3.1 No GraphQL Schema Changes
**Files to modify:**
- None - schema already supports milestones

**Changes:**
- Keep existing `Milestone` type as-is
- Keep existing `milestones` field in `Goal` type
- No new input types or mutations needed

#### 3.2 No New GraphQL Resolvers
**Files to create:**
- None - no new resolvers needed

**Changes:**
- Keep existing milestone calculation in progress resolvers
- No separate milestone resolvers needed
- Milestones returned as part of goal progress data

#### 3.3 No Existing Resolver Changes
**Files to modify:**
- None - current resolvers already work

**Changes:**
- Keep existing goal resolvers as-is
- Milestone data already included in goal responses
- No additional field resolution needed

### Phase 4: Minimal Testing Implementation

#### 4.1 Existing Test Coverage
**Files to verify:**
- `backend/services/quest-service/tests/test_progress.py`

**Test Coverage:**
- Verify existing progress calculation tests cover milestone logic
- Ensure milestone data is correctly returned in progress responses
- Validate milestone calculation accuracy

#### 4.2 No New Integration Tests
**Files to create:**
- None - no new integration tests needed

**Changes:**
- Keep existing progress calculation tests
- No new milestone-specific workflows to test
- Current milestone behavior already tested

#### 4.3 No New Selenium E2E Tests
**Files to create:**
- None - no new E2E tests needed

**Changes:**
- Keep existing progress display tests
- No new milestone management UI to test
- Current milestone display already tested

### Phase 5: No Infrastructure Deployment

#### 5.1 No Terraform Updates
**Files to modify:**
- None - no infrastructure changes needed

**Changes:**
- No new Lambda functions needed
- No new DynamoDB changes
- No new IAM policies needed
- Current infrastructure supports future milestone storage

#### 5.2 No Deployment Scripts
**Files to create:**
- None - no deployment needed

**Changes:**
- No new infrastructure to deploy
- No new services to configure
- Current system already supports milestone functionality

## Implementation Details

### Current Milestone Implementation

**Milestone Storage (Current):**
```json
{
  "milestones": [
    {
      "id": "milestone_25_<goalId>",
      "name": "First Quarter",
      "percentage": 25.0,
      "achieved": false,
      "achievedAt": null,
      "description": "Reach 25% progress"
    }
  ]
}
```

**Progress Calculation Algorithm (Current):**
1. **Load Goal Data**: Get goal record from DynamoDB
2. **Calculate Task Progress**: Compute task completion percentage
3. **Calculate Time Progress**: Compute time-based progress
4. **Calculate Hybrid Progress**: Apply 70/30 weight split
5. **Calculate Milestones**: Generate milestone data dynamically
6. **Return Progress Data**: Include milestone details in response

### No New API Models Needed

**Keep Existing Models:**
- `Milestone` model already exists and works
- `GoalProgressResponse` already includes milestone data
- No new input/output models needed

### Current Error Handling

- **Progress Calculation Errors**: Log errors but return partial data
- **Goal Not Found**: Return 404 for missing goals
- **Database Errors**: Return 500 with structured error logging
- **Validation Errors**: Handled by existing progress calculation

### Current Performance

- **Dynamic Calculation**: Milestones calculated on-demand
- **Goal Record Storage**: Milestones stored as JSON array in goal record
- **No Caching**: Current implementation doesn't use caching
- **No Async Processing**: Milestone calculation is synchronous

## Dependencies

- **17.1**: Goal progress calculation system (already implemented)
- **DynamoDB**: Single-table pattern with GSI1 support (already configured)
- **Lambda**: Quest service with FastAPI framework (already deployed)
- **AppSync**: GraphQL API with Lambda resolvers (already configured)
- **Terraform**: Infrastructure as Code for AWS resources (already deployed)

## Success Criteria

- [ ] DynamoDB schema documentation updated with milestone entity pattern
- [ ] Existing milestone calculation logic continues to work correctly
- [ ] Progress calculation returns milestone data as part of goal progress
- [ ] Existing unit tests continue to pass for milestone functionality
- [ ] No breaking changes to current milestone behavior
- [ ] Documentation prepared for future milestone storage implementation

## Files Summary

**New Files:**
- None - no new files needed

**Modified Files:**
- `docs/dynamodb_single_table_model.md` - Add milestone entity pattern documentation

**No Changes Needed:**
- `backend/services/quest-service/app/models.py` - Keep existing models
- `backend/services/quest-service/app/main.py` - Keep existing logic
- `backend/infra/terraform2/graphql/schema.graphql` - Already supports milestones
- `backend/infra/terraform2/resolvers/*.js` - Already work correctly
- `backend/infra/terraform2/modules/database/dynamodb_single_table/main.tf` - No changes needed
- `backend/infra/terraform2/main.tf` - No changes needed
