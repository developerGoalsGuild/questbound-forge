# Password Reset Tests

## Test Files Created

### Backend Tests
**Location:** `backend/services/user-service/tests/test_password_reset.py`

**Test Coverage:**
- Password Reset Request Endpoint (6 tests)
  - Missing/invalid email validation
  - Nonexistent email handling
  - Unconfirmed email blocking (403 error)
  - Confirmed email success flow
  - Non-local provider handling
- Password Reset Endpoint (6 tests)
  - Missing token validation
  - Invalid token handling
  - Expired token handling
  - Weak password validation
  - Successful password reset
  - Token mismatch detection
- Integration Tests (2 tests)
  - Complete reset flow (request → token → reset)
  - Case-insensitive email matching

**Total:** 14 backend test cases

### Frontend Tests
**Location:** `apps/frontend/src/pages/login/__tests__/`

1. **ForgotPassword.test.tsx** (9 tests)
   - Form rendering
   - Email validation
   - API integration
   - Error handling
   - Success states
   - Loading states

2. **ResetPassword.test.tsx** (13 tests)
   - Token validation
   - Password strength validation
   - Password matching
   - API integration
   - Error handling
   - Success flow

3. **API Tests** (in `src/lib/api.test.ts`)
   - `requestPasswordReset` function (4 tests)
   - `resetPassword` function (4 tests)

**Total:** 26 frontend test cases

## Running the Tests

### Backend Tests

```bash
# Navigate to user-service directory
cd backend/services/user-service

# Option 1: Using pytest directly (if installed)
pytest tests/test_password_reset.py -v

# Option 2: Using UV (recommended per project rules)
uv run pytest tests/test_password_reset.py -v

# Option 3: Run all tests
pytest tests/ -v

# Option 4: Run with coverage
pytest tests/test_password_reset.py --cov=app --cov-report=html
```

### Frontend Tests

```bash
# Navigate to frontend directory
cd apps/frontend

# Install dependencies first (if not already installed)
npm install

# Run password reset tests only
npm test -- src/pages/login/__tests__/ForgotPassword.test.tsx src/pages/login/__tests__/ResetPassword.test.tsx src/lib/api.test.ts

# Or run all tests
npm test

# Run with coverage
npm run test:cov

# Run in watch mode
npm run test:watch
```

## Test Summary

- **Backend:** 14 comprehensive test cases covering all password reset scenarios
- **Frontend:** 26 test cases covering UI components and API integration
- **Total:** 40 test cases

All tests follow existing project patterns and use the same testing frameworks (pytest for backend, vitest for frontend).
