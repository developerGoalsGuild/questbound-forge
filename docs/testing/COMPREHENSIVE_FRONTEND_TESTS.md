# Comprehensive Frontend Integration Tests

## Overview

The comprehensive frontend integration test suite (`comprehensive-frontend-integration.test.cjs`) provides end-to-end testing for **all frontend pages and situations** in the GoalsGuild application.

## Test Coverage

### Public Pages
- ✅ Landing Page (`/`) - All sections (Hero, Problem Recognition, Empathy, How It Works, Feature Carousel, Waitlist, Footer)
- ✅ Login Page (`/login`)
- ✅ Signup Page (`/signup/LocalSignUp`)
- ✅ About Page (`/about`)
- ✅ Blog (`/blog`)
- ✅ Help (`/help`)
- ✅ Privacy Policy (`/privacy`)
- ✅ Terms of Service (`/terms`)
- ✅ Status Page (`/status`)
- ✅ API Documentation (`/docs`)
- ✅ Careers (`/careers`)
- ✅ NotFound/404 Page (invalid routes)

### Authenticated Pages
- ✅ Dashboard (`/dashboard`)
- ✅ Profile View (`/profile`)
- ✅ Profile Edit (`/profile/edit`)
- ✅ Goals List (`/goals/list`)
- ✅ Create Goal (`/goals/create`)
- ✅ Goal Details (`/goals/details/:id`)
- ✅ Quest Dashboard (`/quests/dashboard`)
- ✅ Create Quest (`/quests/create`)
- ✅ Quest Details (`/quests/details/:id`)
- ✅ My Guilds (`/guilds`)
- ✅ Create Guild (`/guilds/create`)
- ✅ Guild Details (`/guilds/:id`)
- ✅ Chat (`/chat`)
- ✅ Subscriptions (`/subscription`)
- ✅ My Collaborations (`/collaborations`)
- ✅ Account Settings (`/account/change-password`)

### Test Scenarios
- ✅ **Navigation**: Testing navigation between all pages
- ✅ **Authentication**: Login flow and protected route redirects
- ✅ **Form Validation**: Input validation and error handling
- ✅ **Responsive Design**: Mobile, tablet, and desktop viewports
- ✅ **Error Handling**: Error boundaries and recovery
- ✅ **Accessibility**: ARIA labels, semantic HTML, heading structure
- ✅ **Loading States**: Page load and content rendering
- ✅ **Protected Routes**: Redirect to login when not authenticated

## Prerequisites

### 1. Test Credentials Setup

Create a `.env.test` file in `apps/frontend/`:

```bash
cd apps/frontend
cat > .env.test << 'EOF'
# Test User Credentials
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password

# Optional: API Gateway Configuration
# VITE_API_GATEWAY_URL=https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com
# VITE_API_GATEWAY_KEY=your-api-key-here

# Optional: App URL (if different from default)
# VITE_APP_URL=http://localhost:8080
EOF
```

Or set environment variables:

```bash
export TEST_USER_EMAIL=your-test-user@example.com
export TEST_USER_PASSWORD=your-test-password
```

### 2. Frontend Server Running

Make sure the frontend development server is running:

```bash
cd apps/frontend
npm run dev
```

The server should be accessible at `http://localhost:8080` (or the URL specified in `VITE_APP_URL`).

### 3. Dependencies Installed

```bash
cd apps/frontend
npm install
```

## Running the Tests

### Quick Start

```bash
cd apps/frontend
npm run test:selenium:comprehensive:verbose
```

### Options

#### Headless Mode (Default)
Tests run in headless Chrome by default. To run with visible browser:

```bash
HEADLESS=false npm run test:selenium:comprehensive:verbose
```

#### Custom Timeout
The default timeout is 10 minutes (600000ms). To adjust:

```bash
npx mocha ../../tests/e2e/selenium/frontend/comprehensive-frontend-integration.test.cjs --timeout 900000
```

#### Specific Test Suite
Run only specific test suites:

```bash
# Only public pages
npx mocha ../../tests/e2e/selenium/frontend/comprehensive-frontend-integration.test.cjs --grep "Public Pages"

# Only authenticated pages
npx mocha ../../tests/e2e/selenium/frontend/comprehensive-frontend-integration.test.cjs --grep "Authenticated Pages"

# Only user experience tests
npx mocha ../../tests/e2e/selenium/frontend/comprehensive-frontend-integration.test.cjs --grep "User Experience"
```

## Test Structure

### Test Suites

1. **Public Pages** - Tests all public-facing pages
   - Landing page sections
   - Info pages (About, Blog, Help, etc.)
   - Login/Signup pages
   - 404 page

2. **Authentication** - Tests authentication flows
   - User login
   - Protected route redirects
   - Session management

3. **Authenticated Pages** - Tests all pages requiring authentication
   - Dashboard
   - Profile
   - Goals
   - Quests
   - Guilds
   - Chat
   - Subscriptions
   - Collaborations
   - Account settings

4. **User Experience** - Tests overall UX
   - Navigation
   - Responsive design
   - Error handling
   - Accessibility

## Test Output

The tests provide detailed console output:

```
🚀 Starting Comprehensive Frontend Integration Tests

✅ Using credentials from .env.test file

🔐 Authenticating user...
✅ User authenticated successfully

🏠 Testing Landing Page...
✅ Landing page verified

📄 Testing Public Info Pages...
  ✅ About page verified
  ✅ Blog page verified
  ✅ Help page verified
  ...
```

## Troubleshooting

### Common Issues

#### 1. Credentials Not Found
```
Error: No test credentials found
```
**Solution**: Create `.env.test` file or set environment variables (see Prerequisites).

#### 2. Frontend Server Not Running
```
Error: Failed to connect to http://localhost:8080
```
**Solution**: Start the frontend development server:
```bash
cd apps/frontend
npm run dev
```

#### 3. Timeout Errors
```
Error: Waiting for element to be located
```
**Solution**: 
- Increase timeout in test configuration
- Check if page is loading correctly
- Verify selectors match current HTML structure

#### 4. Authentication Failures
```
Error: User authentication failed
```
**Solution**:
- Verify test user credentials are correct
- Check if test user account is active
- Ensure API Gateway is accessible

#### 5. Element Not Found
```
Error: Element not found: #selector
```
**Solution**:
- Check if page structure has changed
- Verify selectors in test file match current HTML
- Check if page requires additional loading time

### Debug Mode

Run tests with visible browser for debugging:

```bash
HEADLESS=false npm run test:selenium:comprehensive:verbose
```

This allows you to see:
- What the browser is doing
- Which elements are being interacted with
- Any visual issues or errors

## Continuous Integration

For CI/CD pipelines, use:

```yaml
# Example GitHub Actions
- name: Run Comprehensive Frontend Tests
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    VITE_API_GATEWAY_URL: ${{ secrets.API_GATEWAY_URL }}
    VITE_API_GATEWAY_KEY: ${{ secrets.API_GATEWAY_KEY }}
  run: |
    cd apps/frontend
    npm run test:selenium:comprehensive
```

## Best Practices

1. **Keep Tests Updated**: Update selectors when page structure changes
2. **Use Data Attributes**: Prefer `data-testid` attributes for more stable selectors
3. **Handle Async Operations**: Always wait for elements and page loads
4. **Test Edge Cases**: Include error scenarios and boundary conditions
5. **Maintain Test Credentials**: Keep test user account active and accessible
6. **Run Regularly**: Execute tests as part of CI/CD pipeline

## Adding New Tests

When adding new pages or features:

1. Add test function in appropriate section
2. Use consistent naming: `test[FeatureName]`
3. Include error handling and assertions
4. Add to appropriate test suite
5. Update this documentation

Example:

```javascript
// Test: New Feature Page
async function testNewFeaturePage(driver) {
  console.log('🆕 Testing New Feature Page...');
  
  await driver.get(`${CONFIG.baseUrl}/new-feature`);
  await driver.wait(until.urlContains('/new-feature'), CONFIG.timeout);
  await driver.sleep(2000);
  
  const hasContent = await elementExists(driver, 'main, [role="main"]');
  assert(hasContent, 'New feature page should have content');
  
  console.log('✅ New feature page verified');
}
```

## Performance

- **Total Test Duration**: ~5-10 minutes (depending on network and page load times)
- **Individual Test Timeout**: 30 seconds per test
- **Suite Timeout**: 10 minutes total
- **Parallel Execution**: Not recommended (tests share authentication state)

## Related Documentation

- [Test Credentials Setup](../testing/TEST_CREDENTIALS_SETUP.md)
- [Running Full Tests](../testing/RUN_FULL_TESTS.md)
- [Selenium Test Guide](../testing/QUICK_TEST_GUIDE.md)
