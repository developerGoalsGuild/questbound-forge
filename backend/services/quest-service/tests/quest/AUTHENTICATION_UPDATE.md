# Quest Test Authentication Update

## Overview

The Quest test suite has been updated to use real authentication via the login endpoint instead of Cognito mocking. This provides more realistic integration testing.

## Changes Made

### 1. Updated `run_tests.py`
- Added authentication setup using login endpoint
- Reads credentials from environment variables:
  - `GOALSGUILD_USER` - Test user email/username
  - `GOALSGUILD_PASSWORD` - Test user password
  - `VITE_API_GATEWAY_URL` - API Gateway URL
  - `VITE_API_GATEWAY_KEY` - API Gateway key
- Sets up authentication before running tests
- Passes authentication info to tests via environment variables

### 2. Updated `test_helpers.py`
- Added `AuthHelpers.get_auth_headers()` - Gets auth headers from env vars
- Added `AuthHelpers.get_api_url()` - Gets API URL from env vars
- Added `AuthHelpers.make_authenticated_request()` - Makes real API calls
- Updated `TestClientHelpers` for both unit and integration tests

### 3. Updated Environment Setup Scripts
- Added new environment variables to `setup-env-variables.ps1`
- Added new environment variables to `setup-env-variables.bat`
- Updated verification script to check new variables
- Updated README documentation

### 4. Created New Integration Test
- `test_quest_integration_auth.py` - Shows how to use real authentication
- Demonstrates real API calls with proper authentication
- Includes error handling and cleanup

## Environment Variables Required

### For Tests
```bash
GOALSGUILD_USER=test@example.com
GOALSGUILD_PASSWORD=testpassword123
VITE_API_GATEWAY_URL=https://your-api-gateway-url.execute-api.us-east-2.amazonaws.com/dev
VITE_API_GATEWAY_KEY=your-api-gateway-key-here
```

### For Quest Service
```bash
AWS_DEFAULT_REGION=us-east-2
AWS_REGION=us-east-2
CORE_TABLE=gg_core_test
# ... other service variables
```

## How to Use

### 1. Set Up Environment
```powershell
# Run as Administrator
cd backend/services/quest-service/scripts
.\setup-env-variables.ps1
```

### 2. Configure Authentication
Update the environment variables with your actual values:
- Set `GOALSGUILD_USER` to a valid user email
- Set `GOALSGUILD_PASSWORD` to the user's password
- Set `VITE_API_GATEWAY_URL` to your API Gateway URL
- Set `VITE_API_GATEWAY_KEY` to your API Gateway key

### 3. Run Tests
```bash
cd backend/services/quest-service
python tests/quest/run_tests.py
```

## Test Types

### Unit Tests
- Use mocked authentication via `TestClientHelpers.create_authenticated_client()`
- Fast execution, no external dependencies
- Good for testing business logic

### Integration Tests
- Use real authentication via `AuthHelpers.make_authenticated_request()`
- Make actual API calls to running service
- Test complete request/response cycle

## Authentication Flow

1. `run_tests.py` calls login endpoint with credentials
2. Receives JWT token from login response
3. Sets environment variables for tests
4. Tests use `AuthHelpers` to make authenticated requests
5. All requests include `Authorization: Bearer <token>` and `x-api-key` headers

## Benefits

- **Realistic Testing**: Tests use actual authentication flow
- **Integration Testing**: Tests real API endpoints
- **Error Detection**: Catches authentication-related issues
- **Environment Validation**: Ensures proper configuration

## Migration Notes

- Existing unit tests continue to work with mocked auth
- New integration tests use real authentication
- Both approaches can coexist in the same test suite
- Environment variables must be set before running tests

## Troubleshooting

### Authentication Fails
- Check that `GOALSGUILD_USER` and `GOALSGUILD_PASSWORD` are correct
- Verify `VITE_API_GATEWAY_URL` is accessible
- Ensure `VITE_API_GATEWAY_KEY` is valid

### Tests Fail
- Run `verify-env-variables.ps1` to check configuration
- Ensure Quest service is running and accessible
- Check that DynamoDB table exists and is accessible

### Environment Issues
- Restart terminal after running setup scripts
- Verify environment variables are set: `Get-ChildItem Env: | Where-Object { $_.Name -like 'GOALSGUILD_*' -or $_.Name -like 'VITE_*' }`
