# Running Full Frontend Integration Tests

## Quick Start

Run the comprehensive frontend test suite:

```bash
cd apps/frontend
npm run test:selenium:full:verbose
```

## What Gets Tested

The test suite covers:

### ✅ Landing Page
- Problem Recognition section
- Empathy section
- Solution Intro
- How It Works
- Feature Carousel
- Development Notice
- Waitlist Form
- Newsletter signup

### ✅ Authentication
- Login functionality
- Redirect after login

### ✅ Dashboard
- Dashboard page loads
- Content displays

### ✅ Quests/Goals
- Quests dashboard
- Quests list
- Create quest page
- Goals list
- Create goal page

### ✅ Profile
- Profile page
- Profile information display

### ✅ Guilds
- Guilds page
- Create guild page

### ✅ Chat
- Chat page
- Chat interface

### ✅ Subscriptions
- Subscription plans page

### ✅ Collaborations
- Collaborations page

### ✅ Navigation
- Navigation menu
- Link functionality

### ✅ Responsive Design
- Mobile viewport (375px)
- Tablet viewport (768px)
- Desktop viewport (1920px)

### ✅ Error Handling
- 404 page handling

### ✅ Public Pages
- About page
- Help page

## Credentials

The script will prompt you for:
- **Email**: Your test user email
- **Password**: Your test user password

### Alternative: Environment Variables

You can also set credentials via environment variables:

```bash
export TEST_USER_EMAIL=your-email@example.com
export TEST_USER_PASSWORD=your-password
npm run test:selenium:full:verbose
```

## Options

### Run with Visible Browser

To see the browser during tests (useful for debugging):

```bash
HEADLESS=false npm run test:selenium:full:verbose
```

### Run Only Landing Page Tests

If you only want to test the landing page:

```bash
npm run test:selenium:landing:verbose
```

## Prerequisites

1. **Dev server running** on port 8080:
   ```bash
   npm run dev
   ```

2. **Dependencies installed**:
   ```bash
   npm install
   ```

3. **Valid test user account** with credentials

## Test Output

The tests will show:
- ✅ Passing tests
- ❌ Failing tests with error details
- Progress indicators for each test section
- Total test count and duration

## Troubleshooting

### "Login failed"
- Verify credentials are correct
- Check if user account exists
- Ensure API Gateway is accessible

### "Element not found"
- Check if dev server is running
- Verify page has loaded completely
- Check browser console for errors

### "Timeout errors"
- Increase timeout in test file
- Check network connectivity
- Verify API endpoints are accessible

## Test Duration

Full test suite takes approximately **3-5 minutes** depending on:
- Network speed
- API response times
- Page load times

## Next Steps

After tests complete:
1. Review test results
2. Fix any failing tests
3. Update test selectors if UI changed
4. Re-run tests to verify fixes
