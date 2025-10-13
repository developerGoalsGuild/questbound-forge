# WebSocket Messaging Implementation Plan (Tasks 21.1-21.3)

## Overview
Implement comprehensive real-time messaging functionality using the existing AppSync GraphQL subscription system, which is the most cost-effective approach. Enhance the current implementation by adding missing message history queries and integration endpoints.

**Important Prerequisites:**
- Guild features must be implemented first (gg_guild table creation)
- Collaboration service must be deployed with guild membership management
- This implementation depends on the dual-table architecture where guild-related chat uses gg_guild table

## Current Implementation Status
- ✅ **sendMessage mutation**: Persists messages to DynamoDB with proper single-table patterns
- ✅ **onMessage subscription**: Broadcasts messages to connected clients in real-time
- ❌ **messages query**: Missing resolver for retrieving message history
- ❌ **FastAPI integration**: No WebSocket endpoints in FastAPI services

## Technical Architecture

### Data Model (Dual-Table Design)
Messages are stored using different table patterns based on context:

**Guild Chat Messages (gg_guild table):**
```
Table: gg_guild
PK: GUILD#{guildId}
SK: MSG#{timestamp}#{messageId}
Attributes: id, guildId, senderId, text, ts, type='Message', roomType='guild'
```

**General Room Chat Messages (gg_core table):**
```
Table: gg_core
PK: ROOM#{roomId}
SK: MSG#{timestamp}#{messageId}
Attributes: id, roomId, senderId, text, ts, type='Message', roomType='general'
```

### Room Type Detection Algorithm
1. **Guild Rooms**: If roomId starts with `GUILD#` prefix → use `gg_guild` table
2. **General Rooms**: All other roomIds → use `gg_core` table with `ROOM#{roomId}` pattern
3. **Validation**: Check room existence and user membership before allowing message operations

### GraphQL Schema Integration
Leverages existing Message type and subscription patterns in `schema.graphql`.

## Implementation Phases

### Phase 1: Core Message History Query (Task 21.2)
**Goal**: Implement the missing `messages` query resolver for retrieving message history.

**Files to Create/Modify:**
- `backend/infra/terraform2/resolvers/messages.js` - New query resolver
- `backend/infra/terraform2/resolvers/__tests__/messages.test.js` - Unit tests
- `backend/infra/terraform2/resolvers/context/messages.request.json` - Test context

**Algorithm:**
1. Extract `roomId`, `after` (optional timestamp), `limit` from query parameters
2. Validate user authentication via Lambda authorizer context
3. **Determine Table and Key Pattern:**
   - If roomId starts with `GUILD#` → Query `gg_guild` table with PK = `GUILD#{guildId}`
   - Otherwise → Query `gg_core` table with PK = `ROOM#{roomId}`
4. Query DynamoDB with:
   - SK begins_with `MSG#`
   - Filter by timestamp if `after` provided
   - Limit results and sort by timestamp descending
5. Validate user has access to the room/guild (membership check)
6. Transform results to Message type format
7. Return paginated results

**Error Handling:**
- Invalid roomId: 400 Bad Request
- Unauthorized access: 403 Forbidden
- Database errors: 500 Internal Server Error

### Phase 2: FastAPI WebSocket Integration (Task 21.1)
**Goal**: Create FastAPI endpoints that integrate with GraphQL subscriptions for WebSocket functionality.

**Approach**: Create a new messaging service or extend existing collaboration-service with WebSocket endpoints that proxy to AppSync.

**Files to Create:**
- `backend/services/messaging-service/` - New FastAPI service (or extend collaboration-service)
- WebSocket endpoint handlers for room connections
- GraphQL client integration for message operations
- Docker configuration and deployment scripts

**WebSocket Connection Flow:**
1. Client connects to `/ws/rooms/{roomId}`
2. FastAPI validates JWT token and room access
3. Establishes connection and subscribes to GraphQL `onMessage` subscription
4. Proxies messages between WebSocket clients and GraphQL subscriptions
5. Handles connection lifecycle (disconnect, errors)

### Phase 3: Enhanced Broadcasting (Task 21.3)
**Goal**: Improve message broadcasting reliability and add advanced features.

**Enhancements:**
- Connection health monitoring
- Message delivery confirmations
- Offline message queuing
- Room membership validation (guild membership for guild chats)
- Rate limiting for spam prevention
- **Dual-table message persistence** (guild vs general rooms)

**Files to Modify:**
- `backend/infra/terraform2/resolvers/onMessage.subscribe.js` - Add connection validation
- `backend/infra/terraform2/resolvers/sendMessage.js` - Add dual-table logic and broadcasting enhancements

### Phase 4: Infrastructure & Deployment
**Goal**: Deploy enhanced messaging system to AWS.

**Terraform Updates:**
- Ensure `gg_guild` table is available (from guild features implementation)
- Add messaging service Lambda function (if new service created)
- Update API Gateway with WebSocket routes (if using direct WebSocket)
- Add CloudWatch alarms for messaging metrics
- Update IAM policies for new permissions (access to both `gg_core` and `gg_guild` tables)

**Environment Configuration:**
- Add messaging service to terraform variables
- Configure environment-specific settings
- Update deployment scripts

### Phase 5: Testing & Quality Assurance
**Unit Tests:**
- Message query resolver functionality
- WebSocket connection handling
- Authentication and authorization
- Error scenarios and edge cases

**Integration Tests:**
- End-to-end message sending and receiving
- WebSocket connection lifecycle
- Message history pagination
- Concurrent user scenarios

**Automation:**
- `tests/integration/websocketMessagingTest.js` - Selenium integration test
- `scripts/run-websocket-messaging-tests.ps1` - PowerShell test runner
- CI/CD pipeline integration

## Security Considerations
- JWT token validation on all WebSocket connections
- Room access control and membership validation
- Message content sanitization
- Rate limiting and abuse prevention
- Audit logging for all message operations

## Performance Optimizations
- DynamoDB query optimization with proper indexes
- Message pagination with cursor-based navigation
- Connection pooling for WebSocket clients
- Caching for frequently accessed room data
- Horizontal scaling for high-traffic rooms

## Monitoring & Observability
- CloudWatch metrics for message throughput
- X-Ray tracing for message delivery paths
- Error logging and alerting
- Performance dashboards
- SLO monitoring (p95 latency < 200ms)

## Dependencies
- Existing collaboration-service (room management)
- **gg_guild table** (from guild features implementation - prerequisite)
- AppSync GraphQL API (message operations)
- DynamoDB tables: `gg_core` (general rooms) and `gg_guild` (guild chats)
- Lambda authorizer (authentication)

## Risk Mitigation
- Backward compatibility with existing GraphQL subscriptions
- Gradual rollout with feature flags
- Comprehensive testing before production deployment
- Rollback procedures documented

## Success Criteria
- Message history queries return results within 200ms (p95)
- WebSocket connections handle 1000+ concurrent users per room
- 99.9% message delivery success rate
- Full integration test suite passing
- No regression in existing functionality

## Definition of Done Checklist

### ✅ **Work Items Completed**
- [ ] `messages` query resolver implemented with proper DynamoDB queries
- [ ] FastAPI WebSocket endpoint created with connection management
- [ ] Message broadcasting enhanced with health monitoring
- [ ] Terraform infrastructure updated for deployment
- [ ] Unit tests written for all new resolvers and services
- [ ] Integration tests created with Selenium automation
- [ ] PowerShell test runner script created

### ✅ **Quality & Delivery**
- [ ] Unit tests written & passing (required)
- [ ] Integration tests passing in dev environment
- [ ] UAT scenario verified - manual testing confirms message sending/receiving works
- [ ] Static analysis & style checks passing (ESLint, type checking)
- [ ] Security checks passing (no hardcoded secrets, proper auth validation)
- [ ] Performance sanity check complete (query latency < 200ms)
- [ ] Documentation updated (API docs, README files)
- [ ] IaC updated & applied to dev environment
- [ ] Deployed to dev via CI/CD pipeline
- [ ] Smoke tests passed in dev environment
- [ ] Promote to staging environment (if applicable)

### ✅ **Code Quality Standards**
- [ ] DRY principle followed - no code duplication
- [ ] SOLID principles applied - single responsibility, proper abstraction
- [ ] Semantic naming used throughout (isLoading, hasError, etc.)
- [ ] TypeScript first - all code properly typed with interfaces
- [ ] Functional components with proper React patterns
- [ ] Modulo composition over complex inheritance
- [ ] Client-side optimization - use client directives used sparingly

### ✅ **Accessibility & UX**
- [ ] ARIA live regions implemented for dynamic message updates
- [ ] Focus management working for message input/output
- [ ] Screen reader announcements for new messages
- [ ] Keyboard navigation fully functional
- [ ] Error messages properly associated with inputs (aria-describedby)
- [ ] Loading states with skeleton components
- [ ] Network error recovery mechanisms implemented

### ✅ **Security & Authorization**
- [ ] JWT token validation on all WebSocket connections
- [ ] Room access control and membership validation
- [ ] Message content sanitization implemented
- [ ] Rate limiting for spam prevention
- [ ] RBAC (Role-Based Access Control) enforced
- [ ] Input validation with Zod schemas
- [ ] Audit logging for security events

### ✅ **Internationalization**
- [ ] Message-related translations added to i18n files
- [ ] Support for English, Spanish, and French
- [ ] Proper translation key structure (messages.{feature}.{key})
- [ ] Fallback handling for missing translations

### ✅ **Performance Optimization**
- [ ] Message pagination implemented (cursor-based)
- [ ] DynamoDB queries optimized with proper indexes
- [ ] WebSocket connection pooling
- [ ] Debounced operations where applicable
- [ ] Memoization for expensive calculations
- [ ] Core Web Vitals optimized (LCP, CLS, FID)

### ✅ **Error Handling & Resilience**
- [ ] Comprehensive error logging with structured JSON
- [ ] Graceful degradation for failed operations
- [ ] Network error recovery with retry mechanisms
- [ ] User-friendly error messages
- [ ] Defensive error handling throughout
- [ ] Circuit breaker patterns where applicable

### ✅ **Testing Standards**
- [ ] Unit tests for all new code paths (100% coverage target)
- [ ] Integration tests for end-to-end message flows
- [ ] Error scenario testing (network failures, auth errors, validation)
- [ ] Accessibility testing (screen reader compatibility)
- [ ] Cross-browser testing with Selenium Grid
- [ ] Load testing for concurrent users
- [ ] E2E testing with complete user journeys

### ✅ **Documentation Standards**
- [ ] Implementation documentation updated
- [ ] API documentation current (OpenAPI/AppSync schema)
- [ ] Code comments for complex business logic
- [ ] README updates for new features
- [ ] Error debugging information included in logs
- [ ] Architecture diagrams updated if needed

### ✅ **Operational Readiness**
- [ ] CloudWatch alarms configured for messaging metrics
- [ ] X-Ray tracing implemented for message delivery
- [ ] SLO monitoring (p95 latency, error rates)
- [ ] Log aggregation and monitoring setup
- [ ] Backup and disaster recovery procedures
- [ ] Performance monitoring dashboards

### ✅ **Business Requirements**
- [ ] Real-time messaging working across all supported clients
- [ ] Message history accessible with pagination
- [ ] Room-based messaging with proper isolation (general rooms vs guild rooms)
- [ ] **Guild chat messages stored in gg_guild table with proper partitioning**
- [ ] **General room chat messages stored in gg_core table**
- [ ] Message persistence with TTL configuration
- [ ] Integration with existing user authentication and guild membership
- [ ] Support for rich message content (text, potentially attachments)
- [ ] Message delivery guarantees (at-least-once delivery)
- [ ] Offline message queuing and delivery
- [ ] Guild membership validation for guild chat access

### ✅ **Compliance & Legal**
- [ ] GDPR compliance for message data handling
- [ ] Data retention policies implemented
- [ ] User data export/deletion capabilities
- [ ] Privacy policy updates if needed
- [ ] Terms of service updates for messaging features

**Final Approval Gates:**
- [ ] Product owner acceptance testing passed
- [ ] Security review completed with no critical issues
- [ ] Performance review passed against SLIs/SLOs
- [ ] Accessibility audit passed (WCAG 2.1 AA compliance)
- [ ] Legal/compliance review completed
- [ ] All Definition of Done checklist items checked ✅
