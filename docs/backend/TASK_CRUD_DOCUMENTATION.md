# Task CRUD Operations Documentation

This document outlines the complete CRUD operations implemented for managing tasks within the Quest service, including security measures, API endpoints, and infrastructure changes.

## Overview

The Quest service now supports full CRUD operations for tasks:
- **Create**: `POST /quests/createTask` (existing)
- **Read**: `GET /quests` (goals), individual task retrieval not implemented yet
- **Update**: `PUT /quests/tasks/{taskId}` (new)
- **Delete**: `DELETE /quests/tasks/{taskId}` (new)

## API Endpoints

### Update Task
**Endpoint**: `PUT /quests/tasks/{taskId}`

**Authentication**: Required (Bearer token with JWT)

**Request Body**:
```json
{
  "title": "Updated Task Title (optional)",
  "dueAt": 1735689600 (optional, epoch seconds),
  "status": "active|completed|cancelled" (optional),
  "tags": ["tag1", "tag2"] (optional)
}
```

**Response**:
```json
{
  "id": "task-123",
  "goalId": "goal-456",
  "title": "Updated Task Title",
  "dueAt": 1735689600,
  "status": "completed",
  "createdAt": 1609459200000,
  "updatedAt": 1640995200000,
  "tags": ["tag1", "tag2"]
}
```

**Validation Rules**:
- Task must exist and belong to the authenticated user
- `dueAt` cannot exceed the associated goal's deadline
- `status` must be one of: `active`, `completed`, `cancelled`
- `tags` must be a non-empty list of non-empty strings
- `title` must be a non-empty string if provided

### Delete Task
**Endpoint**: `DELETE /quests/tasks/{taskId}`

**Authentication**: Required (Bearer token with JWT)

**Response**:
```json
{
  "message": "Task deleted successfully"
}
```

**Validation Rules**:
- Task must exist and belong to the authenticated user

## Security Measures

### Authentication & Authorization
- All task CRUD operations require valid JWT authentication
- Users can only access/modify tasks that belong to them
- Authorization is enforced at the application level by checking the `user_id` from JWT claims against the task's partition key (`USER#{user_id}`)

### Input Validation
- All input is validated using Pydantic models
- String sanitization prevents XSS attacks
- Type validation ensures data integrity
- Business rule validation (e.g., task due dates cannot exceed goal deadlines)

### CORS Configuration
- Proper CORS headers are configured for cross-origin requests
- Credentials are allowed for authenticated requests
- Preflight OPTIONS requests are handled appropriately

## Database Design

### Single Table Design
Tasks are stored in DynamoDB using a single table pattern:

**Partition Key (PK)**: `USER#{user_id}`
**Sort Key (SK)**: `TASK#{task_id}`

**GSI for querying**: `USER#{user_id}` (PK), `ENTITY#Task#{createdAt}` (SK)

### Task Item Structure
```json
{
  "PK": "USER#user-123",
  "SK": "TASK#task-123",
  "type": "Task",
  "id": "task-123",
  "goalId": "goal-456",
  "title": "Task Title",
  "dueAt": 1735689600,
  "status": "active",
  "createdAt": 1609459200000,
  "updatedAt": 1609459200000,
  "tags": ["urgent", "important"],
  "GSI1PK": "USER#user-123",
  "GSI1SK": "ENTITY#Task#1609459200000"
}
```

## Unit Tests

Comprehensive unit tests cover:
- Successful update operations (full and partial updates)
- Task not found scenarios
- Authentication requirements
- Authorization (users cannot access others' tasks)
- Input validation (invalid status, due date constraints)
- Successful delete operations
- Delete not found scenarios

**Test Coverage**: 11 test cases covering all CRUD operations and security scenarios

## Infrastructure Changes

### API Gateway Configuration
New Terraform resources added to `backend/infra/terraform/modules/network/api_gateway.tf`:

#### Resources Added:
- `aws_api_gateway_resource.quest_tasks_resource` - `/quests/tasks`
- `aws_api_gateway_resource.quest_task_resource` - `/quests/tasks/{taskId}`

#### Methods Added:
- `PUT /quests/tasks/{taskId}` with Lambda authorizer
- `DELETE /quests/tasks/{taskId}` with Lambda authorizer
- `OPTIONS /quests/tasks/{taskId}` for CORS

#### Security:
- Custom Lambda authorizer for authentication
- No API key required for authenticated endpoints
- Proper CORS configuration with credentials support

### Deployment
- API Gateway deployment includes all new methods and integrations
- Automatic redeployment triggered on configuration changes

## Error Handling

### HTTP Status Codes
- `200`: Success (update returns updated task, delete returns confirmation)
- `400`: Bad Request (validation errors, business rule violations)
- `401`: Unauthorized (missing/invalid authentication)
- `404`: Not Found (task doesn't exist or doesn't belong to user)
- `500`: Internal Server Error (database or system errors)

### Error Response Format
```json
{
  "detail": "Error description message"
}
```

## Monitoring & Logging

### Structured Logging
All operations include structured logging with:
- User ID tracking
- Operation type and outcome
- Error details and stack traces
- Performance metrics

### CloudWatch Integration
- API Gateway access logs configured
- Lambda function logs available
- Error tracking and alerting possible

## Usage Examples

### Update Task Status
```bash
curl -X PUT "https://api.example.com/quests/tasks/task-123" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### Delete Task
```bash
curl -X DELETE "https://api.example.com/quests/tasks/task-123" \
  -H "Authorization: Bearer <jwt_token>"
```

### Partial Update
```bash
curl -X PUT "https://api.example.com/quests/tasks/task-123" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "New Title", "tags": ["important"]}'
```

## Future Enhancements

Potential improvements for future versions:
- Task retrieval endpoint (`GET /quests/tasks/{taskId}`)
- Bulk operations (update/delete multiple tasks)
- Task filtering and search
- Task history/audit trail
- Task dependencies and relationships
- Task assignment to team members (if multi-user goals implemented)

## Deployment Instructions

1. Deploy the updated Quest service Lambda function
2. Apply the updated Terraform configuration for API Gateway
3. Verify endpoints are accessible and functional
4. Run unit tests to ensure no regressions
5. Update API documentation and client applications

## Rollback Plan

If issues arise:
1. The new endpoints are additive only - existing functionality remains unchanged
2. API Gateway can be rolled back by reverting Terraform changes
3. Lambda function can be rolled back to previous version
4. Database changes are backward compatible (no schema changes required)
