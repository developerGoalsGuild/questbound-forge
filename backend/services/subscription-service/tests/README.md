# Subscription Service Tests

This directory contains automated tests for the subscription service.

## Test Structure

### Unit Tests
- `conftest.py` - Pytest fixtures and configuration
- `test_main_api.py` - API endpoint tests
- `test_auth.py` - Authentication tests
- `test_mock_stripe.py` - Mock Stripe integration tests
- `test_database.py` - Database operation tests
- `test_models.py` - Pydantic model validation tests
- `test_settings.py` - Settings configuration tests
- `test_stripe_client.py` - Stripe client wrapper tests

### Integration Tests
- `test_integration.py` - End-to-end integration tests
- `test_integration_auth.py` - Real JWT authentication integration tests
- `README_INTEGRATION.md` - Integration test documentation

## Running Tests

### Run all tests
```bash
pytest tests/
```

### Run only unit tests
```bash
pytest tests/ -k "not integration"
```

### Run only integration tests
```bash
pytest tests/test_integration*.py -v
```

### Run specific test file
```bash
pytest tests/test_main_api.py
```

### Run with coverage
```bash
pytest tests/ --cov=app --cov-report=html
```

### Run with verbose output
```bash
pytest tests/ -v
```

### Run specific test
```bash
pytest tests/test_main_api.py::TestHealthCheck::test_health_check_success
```

## Test Coverage

### Unit Tests Cover:
- ✅ Health check endpoint
- ✅ Authentication and authorization
- ✅ Subscription endpoints (current, create-checkout, cancel, portal)
- ✅ Credit management endpoints (balance, topup)
- ✅ Webhook endpoint
- ✅ Mock Stripe integration
- ✅ Database operations (subscription and credit DB)
- ✅ Pydantic model validation
- ✅ Settings configuration
- ✅ Stripe client wrapper

### Integration Tests Cover:
- ✅ Complete subscription lifecycle (create → use → cancel)
- ✅ Credit lifecycle (balance → topup → consume)
- ✅ End-to-end flows with real components
- ✅ Real JWT authentication verification
- ✅ Database operations with realistic data patterns
- ✅ Mock Stripe operations in real scenarios
- ✅ Webhook event processing
- ✅ Error handling and edge cases

## Test Fixtures

### `app_client`
Provides a FastAPI TestClient with mocked authentication.

### `mock_settings`
Mocks the Settings class with test configuration.

### `test_token`
Generates a valid JWT token for testing.

### `mock_stripe_client`
Mocks the Stripe client for testing.

### `mock_dynamodb_table`
Mocks DynamoDB table operations.

## Mock vs Real Stripe

Tests use mock Stripe by default (when `use_mock_stripe=True`). This allows testing without real Stripe API keys.

To test with real Stripe:
1. Set `STRIPE_SECRET_KEY` environment variable
2. Set `ENVIRONMENT=prod`
3. Tests will use real Stripe API (use test mode keys)

## Continuous Integration

Tests are designed to run in CI/CD pipelines:
- No external dependencies required (uses mocks)
- Fast execution
- Comprehensive coverage
- Isolated test cases

