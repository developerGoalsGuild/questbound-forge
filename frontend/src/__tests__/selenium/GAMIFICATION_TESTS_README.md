# Gamification Features Selenium Tests

Comprehensive end-to-end Selenium tests for all gamification features including XP system, badges, challenges, and leaderboards.

## Test Coverage

### XP System Tests
- ✅ XP Display on profile page
- ✅ XP API endpoints (current, history)
- ✅ Level progression display
- ✅ XP award functionality
- ✅ XP history retrieval

### Badge System Tests
- ✅ Badge display on profile page
- ✅ Badge API endpoints (list, user badges)
- ✅ Badge categories and rarity display
- ✅ Badge earning scenarios

### Challenge System Tests
- ✅ Challenge listing via API
- ✅ Challenge creation
- ✅ Challenge joining
- ✅ Challenge progress tracking

### Leaderboard Tests
- ✅ Global XP leaderboard
- ✅ Level leaderboard
- ✅ Badge leaderboard

### Performance & UX Tests
- ✅ Loading states
- ✅ API response times
- ✅ Error handling
- ✅ Mobile responsiveness
- ✅ Accessibility (ARIA labels, roles)

## Prerequisites

1. **Node.js and npm** installed
2. **Selenium WebDriver** dependencies:
   ```bash
   npm install selenium-webdriver
   npm install --save-dev mocha
   ```

3. **Browser Drivers**:
   - Chrome: ChromeDriver (automatically managed by selenium-webdriver)
   - Firefox: GeckoDriver
   - Edge: EdgeDriver

4. **Environment Variables** (required):
   ```bash
   export VITE_API_GATEWAY_URL="https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1"
   export VITE_API_GATEWAY_KEY="your-api-key"
   export TEST_USER_EMAIL="test@example.com"
   export TEST_USER_PASSWORD="test-password"
   ```

5. **Optional Environment Variables**:
   ```bash
   export VITE_APP_URL="http://localhost:5173"  # Frontend URL
   export SELENIUM_GRID_URL="http://localhost:4444"  # Selenium Grid URL
   export TEST_BROWSER="chrome"  # chrome, firefox, or edge
   export HEADLESS="true"  # Set to "false" to see browser
   ```

## Running the Tests

### Run All Gamification Tests
```bash
npm run test:selenium:gamification
```

### Run with Verbose Output
```bash
npm run test:selenium:gamification:verbose
```

### Run with Visible Browser (Non-Headless)
```bash
HEADLESS=false npm run test:selenium:gamification
```

### Run with Specific Browser
```bash
TEST_BROWSER=firefox npm run test:selenium:gamification
```

### Run with Selenium Grid
```bash
SELENIUM_GRID_URL=http://grid-host:4444 npm run test:selenium:gamification
```

## Test Scenarios

### 1. XP System Tests
- **XP Display**: Verifies XP card appears on profile page with level, XP amount, and progress bar
- **XP API**: Tests `/xp/current` and `/xp/history` endpoints
- **Level Progression**: Checks that level increases correctly based on XP
- **XP Award**: Tests internal XP award endpoint (requires internal key)

### 2. Badge System Tests
- **Badge Display**: Verifies badge card appears on profile page
- **Badge API**: Tests `/badges`, `/badges/me`, and `/badges/{userId}` endpoints
- **Badge Categories**: Verifies badge rarity colors and categories are displayed
- **No Badges State**: Tests empty state when user has no badges

### 3. Challenge System Tests
- **List Challenges**: Tests `/challenges` endpoint
- **Create Challenge**: Creates a test challenge via API
- **Join Challenge**: Joins the created challenge
- **Challenge Progress**: Verifies participant progress tracking

### 4. Leaderboard Tests
- **Global Leaderboard**: Tests `/leaderboard/global` endpoint
- **Level Leaderboard**: Tests `/leaderboard/level` endpoint
- **Badge Leaderboard**: Tests `/leaderboard/badges` endpoint
- **Leaderboard Sorting**: Verifies entries are sorted correctly

### 5. Error Handling Tests
- **Invalid Endpoints**: Tests 404/401 responses for invalid API calls
- **Missing Authentication**: Tests error handling for unauthenticated requests
- **Network Errors**: Verifies graceful error handling

### 6. Performance Tests
- **API Response Times**: Measures response times for all gamification endpoints
- **Loading States**: Verifies loading indicators appear and disappear correctly
- **Concurrent Requests**: Tests multiple simultaneous API calls

### 7. Accessibility Tests
- **ARIA Labels**: Verifies proper ARIA labels on interactive elements
- **Screen Reader Support**: Checks heading structure and semantic HTML
- **Keyboard Navigation**: Tests keyboard accessibility

### 8. Responsive Design Tests
- **Mobile Viewport**: Tests gamification features on mobile (375x667)
- **Tablet Viewport**: Tests on tablet-sized screens
- **Desktop Viewport**: Tests on desktop (1920x1080)

## Test Structure

```
gamification-selenium.test.js
├── Setup & Configuration
│   ├── validateEnvironment()
│   ├── createDriver()
│   └── authenticateUser()
├── XP System Tests
│   ├── testXPDisplay()
│   ├── testXPAPI()
│   ├── testXPHistory()
│   ├── testLevelProgression()
│   └── testXPAward()
├── Badge System Tests
│   ├── testBadgeDisplay()
│   ├── testBadgeAPI()
│   ├── testBadgeListAPI()
│   └── testBadgeCategories()
├── Challenge System Tests
│   ├── testChallengeAPI()
│   └── testChallengeFlow()
├── Leaderboard Tests
│   └── testLeaderboardAPI()
├── Performance & UX Tests
│   ├── testLoadingStates()
│   ├── testAPIResponseTimes()
│   └── testErrorHandling()
├── Accessibility Tests
│   └── testAccessibility()
└── Responsive Design Tests
    └── testMobileResponsiveness()
```

## Expected Test Results

### Successful Test Run
- All API endpoints return 200/201 status codes
- XP and Badge displays appear on profile page
- Challenges can be created and joined
- Leaderboards return data
- Response times are under 2 seconds
- No accessibility violations
- Mobile layout is functional

### Known Limitations
- XP Award endpoint requires internal key (may fail in test environment)
- Some tests may show warnings if user has no XP/badges yet (expected)
- Challenge creation requires authentication
- Leaderboards may be empty for new deployments

## Troubleshooting

### Tests Fail with "No auth token found"
- Ensure `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are correct
- Verify user exists and can log in manually
- Check that authentication completes before API tests run

### Tests Fail with "Element not found"
- Increase `CONFIG.timeout` value
- Check that frontend is running on `VITE_APP_URL`
- Verify page has loaded completely (add `driver.sleep()` if needed)

### API Calls Fail with 401/403
- Verify `VITE_API_GATEWAY_KEY` is correct
- Check that user token is valid
- Ensure API Gateway is deployed and accessible

### Browser Doesn't Start
- Install browser drivers: `npm install --save-dev chromedriver geckodriver`
- Check browser is installed on system
- Try different browser: `TEST_BROWSER=firefox`

### Tests Timeout
- Increase timeout in test file: `this.timeout(300000)`
- Check network connectivity
- Verify API Gateway is responding

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Gamification Selenium Tests
  env:
    VITE_API_GATEWAY_URL: ${{ secrets.API_GATEWAY_URL }}
    VITE_API_GATEWAY_KEY: ${{ secrets.API_GATEWAY_KEY }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
  run: |
    npm run test:selenium:gamification
```

## Test Data Requirements

For comprehensive testing, ensure test user has:
- Some XP earned (to test XP display)
- At least one badge (to test badge display)
- Ability to create challenges
- Access to leaderboard data

## Maintenance

- Update selectors if UI components change
- Adjust timeouts based on API response times
- Add new test cases as features are added
- Update environment variable documentation
- Keep browser drivers up to date

## Related Documentation

- [Selenium WebDriver Documentation](https://www.selenium.dev/documentation/)
- [Mocha Test Framework](https://mochajs.org/)
- [Gamification API Documentation](../docs/gamification-api.md)

