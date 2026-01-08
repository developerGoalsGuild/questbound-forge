# GoalsGuild QuestBound Forge - Testing

This directory contains all test files organized by test type.

## Test Organization

### 🔗 [Integration](./integration/)
Integration tests that test multiple components together.
- Service integration tests
- Component integration tests
- API integration tests

### 🎭 [E2E/Selenium](./e2e/selenium/)
End-to-end tests using Selenium for browser automation.
- Selenium test suites
- E2E test scenarios
- Browser automation tests

### 📦 [Fixtures](./fixtures/)
Test data, JSON fixtures, and test artifacts.
- Test data files
- JSON fixtures
- Test credentials (gitignored)
- Test results and screenshots

### 🛠️ [Utils](./utils/)
Test utilities, helpers, and shared test code.
- Test framework utilities
- Helper functions
- Shared test utilities

## Running Tests

### Integration Tests
```bash
# Run all integration tests
npm run test:selenium

# Run specific integration test
node tests/integration/goalProgressTest.js
```

### E2E Tests
```powershell
# Run Selenium tests
.\scripts\testing\run-quest-analytics-selenium-tests.ps1

# Run with specific browser
.\scripts\testing\run-quest-analytics-selenium-tests.ps1 -Browser chrome -Headless
```

### Frontend Tests
```bash
cd apps/frontend
npm test
npm run test:cov
```

### Backend Tests
```bash
cd backend/services/[service-name]
pytest tests/
```

## Test Structure

### Integration Tests
Located in `tests/integration/`, these tests verify that multiple components work together correctly.

### E2E Tests
Located in `tests/e2e/selenium/`, these tests use Selenium to test the full application flow in a browser.

### Fixtures
Test data and artifacts are stored in `tests/fixtures/`. Sensitive data like credentials should be gitignored.

### Utils
Shared test utilities are in `tests/utils/` and can be imported by any test file.

## Test Requirements

### For Integration Tests
- Node.js installed
- Test environment configured
- Required environment variables set

### For E2E Tests
- Selenium Grid running (or local browser)
- Browser drivers installed
- Test user credentials configured

### For Frontend Tests
- Node.js and npm installed
- Frontend dependencies installed (`npm install` in `apps/frontend`)

### For Backend Tests
- Python 3.12+ installed
- Service dependencies installed
- Test database configured (if needed)

## Environment Variables

Common environment variables for tests:
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password
- `BASE_URL` - Application base URL
- `SELENIUM_GRID_URL` - Selenium Grid URL
- `VITE_API_GATEWAY_URL` - API Gateway URL
- `VITE_API_GATEWAY_KEY` - API Gateway key

## Best Practices

1. **Isolation**: Tests should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data and resources after tests
3. **Naming**: Use descriptive test names that explain what is being tested
4. **Fixtures**: Use fixtures for test data instead of hardcoding values
5. **Error Handling**: Include proper error handling and meaningful error messages
6. **Documentation**: Document complex test scenarios

## Adding New Tests

When adding new tests:
1. Place them in the appropriate subdirectory
2. Follow existing naming conventions
3. Include proper setup and teardown
4. Use fixtures for test data
5. Document any special requirements

## Test Coverage

Test coverage reports are generated for:
- Frontend: `apps/frontend/coverage/`
- Backend services: Service-specific coverage directories

Run coverage reports:
```bash
# Frontend
cd apps/frontend && npm run test:cov

# Backend
cd backend/services/[service-name] && pytest --cov
```

