# Integration Tests for Subscription Service

This directory contains integration tests that verify end-to-end functionality with real components working together.

## Integration Test Structure

- `test_integration.py` - Main integration tests for subscription and credit flows
- `test_integration_auth.py` - Real JWT authentication integration tests

## What Integration Tests Cover

### 1. Subscription Lifecycle
- ✅ Complete subscription flow (create, get, cancel)
- ✅ Subscription status management
- ✅ Period tracking and updates

### 2. Credit Lifecycle
- ✅ Credit balance management
- ✅ Credit top-up operations
- ✅ Credit consumption with balance checks
- ✅ Insufficient balance handling

### 3. Stripe Integration
- ✅ Checkout session creation
- ✅ Customer portal URL generation
- ✅ Subscription cancellation via Stripe
- ✅ Mock Stripe operations in real scenarios

### 4. Webhook Processing
- ✅ Webhook event reception
- ✅ Event type handling
- ✅ Signature verification (mocked in test mode)

### 5. Authentication Flow
- ✅ Real JWT token verification
- ✅ Token validation (expired, invalid, missing claims)
- ✅ Header handling (case-insensitive, Bearer prefix)

### 6. End-to-End Flows
- ✅ Complete user journey: signup → subscribe → use credits → cancel
- ✅ Database operations with realistic data
- ✅ Error handling and edge cases

## Running Integration Tests

### Run all integration tests
```bash
pytest tests/test_integration*.py -v
```

### Run specific integration test file
```bash
pytest tests/test_integration.py -v
pytest tests/test_integration_auth.py -v
```

### Run with coverage
```bash
pytest tests/test_integration*.py --cov=app --cov-report=html
```

### Run specific test class
```bash
pytest tests/test_integration.py::TestSubscriptionLifecycleIntegration -v
```

### Run specific test
```bash
pytest tests/test_integration.py::TestSubscriptionLifecycleIntegration::test_subscription_flow_end_to_end -v
```

## Integration Test Fixtures

### `integration_client`
Test client with real authentication components (not fully mocked).

### `integration_token`
Valid JWT token for integration tests.

### `integration_user_id`
Unique user ID generated for each integration test.

### `mock_dynamodb_table_integration`
In-memory DynamoDB table mock with realistic behavior (stores items, supports queries).

### `real_auth_client`
Test client with real JWT verification (no authentication mocking).

## Differences from Unit Tests

### Integration Tests
- Use real components where possible
- Test full flows end-to-end
- Verify component interactions
- Use realistic data patterns
- May use in-memory mocks that simulate real behavior

### Unit Tests
- Mock all external dependencies
- Test individual functions in isolation
- Fast execution
- Focus on specific functionality

## Test Data Management

Integration tests use unique user IDs to avoid conflicts:
- Format: `integration-test-user-{uuid}`
- Each test gets a fresh user ID
- Test data is isolated per test run

## Mock Stripe vs Real Stripe

Integration tests use mock Stripe by default:
- `use_mock_stripe=True` in test settings
- No real Stripe API keys needed
- Simulates Stripe behavior realistically

To test with real Stripe (test mode):
1. Set `STRIPE_SECRET_KEY` environment variable
2. Set `ENVIRONMENT=prod` (or adjust settings)
3. Use Stripe test mode keys

## Database Operations

Integration tests use in-memory mocks that:
- Store items in memory
- Support get, put, update, query operations
- Simulate DynamoDB behavior
- Allow testing full CRUD flows

For real DynamoDB testing:
1. Set up local DynamoDB or test table
2. Set `TEST_DYNAMODB_TABLE` environment variable
3. Tests will use real DynamoDB operations

## Continuous Integration

Integration tests are designed for CI/CD:
- No external services required (uses mocks)
- Fast execution
- Comprehensive coverage
- Isolated test cases
- Deterministic results

## Troubleshooting

### Tests failing with authentication errors
- Check JWT secret matches in settings
- Verify token expiration is valid
- Ensure all required claims are present

### Tests failing with database errors
- Verify mock DynamoDB table is properly initialized
- Check that items are being stored correctly
- Ensure query patterns match expected format

### Stripe operations failing
- Verify `use_mock_stripe=True` in settings
- Check mock Stripe client is initialized
- Ensure Stripe operations return expected format

