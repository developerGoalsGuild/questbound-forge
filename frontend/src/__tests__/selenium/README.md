# Quest Analytics Selenium Integration Tests

This directory contains Selenium WebDriver integration tests for the Quest Analytics feature. These tests verify the end-to-end functionality of the analytics dashboard using real browser automation.

## Prerequisites

### 1. Environment Variables

Before running the tests, you must set the following environment variables:

```powershell
# Required environment variables
$env:VITE_API_GATEWAY_URL = "https://your-api-gateway-url.com"
$env:VITE_API_GATEWAY_KEY = "your-api-gateway-key"
$env:TEST_USER_EMAIL = "test@example.com"
$env:TEST_USER_PASSWORD = "your-test-password"

# Optional environment variables
$env:SELENIUM_GRID_URL = "http://selenium-grid-url:4444"  # For remote grid
$env:TEST_BROWSER = "chrome"  # chrome, firefox, edge
$env:SELENIUM_HEADLESS = "true"  # true, false
```

### 2. Browser Drivers

You need to install the appropriate browser driver for your chosen browser:

#### Chrome
```bash
# Install chromedriver
npm install -g chromedriver
# Or download from https://chromedriver.chromium.org/
```

#### Firefox
```bash
# Install geckodriver
npm install -g geckodriver
# Or download from https://github.com/mozilla/geckodriver/releases
```

#### Edge
```bash
# Install msedgedriver
npm install -g msedgedriver
# Or download from https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/
```

### 3. Dependencies

Install the required dependencies:

```bash
npm install --save-dev selenium-webdriver mocha
```

## Running the Tests

### Method 1: Using the PowerShell Script (Recommended)

```powershell
# Run with default settings (Chrome, headless)
.\scripts\run-quest-analytics-selenium-tests.ps1

# Run with specific browser
.\scripts\run-quest-analytics-selenium-tests.ps1 -Browser firefox

# Run with Selenium Grid
.\scripts\run-quest-analytics-selenium-tests.ps1 -GridUrl "http://selenium-grid:4444"

# Run in non-headless mode (visible browser)
.\scripts\run-quest-analytics-selenium-tests.ps1 -Headless:$false

# Run with verbose output
.\scripts\run-quest-analytics-selenium-tests.ps1 -Verbose
```

### Method 2: Using npm scripts

```bash
# Run Selenium tests
npm run test:selenium

# Run with verbose output
npm run test:selenium:verbose
```

### Method 3: Direct Mocha execution

```bash
# Run directly with Mocha
npx mocha src/__tests__/selenium/quest-analytics-selenium.test.js --timeout 120000

# Run with verbose output
npx mocha src/__tests__/selenium/quest-analytics-selenium.test.js --timeout 120000 --reporter spec
```

## Test Coverage

The Selenium tests cover the following scenarios:

### 1. Authentication and Navigation
- ✅ User login with valid credentials
- ✅ Navigation to quest dashboard
- ✅ Proper session management

### 2. Analytics Dashboard Loading
- ✅ Analytics dashboard appears after quest dashboard loads
- ✅ Analytics title and main components are visible
- ✅ No JavaScript errors during loading

### 3. Analytics Metrics Display
- ✅ Total quests metric is displayed
- ✅ Completed quests metric is displayed
- ✅ Success rate metric is displayed
- ✅ XP earned metric is displayed
- ✅ All metrics show valid values

### 4. Period Selector Functionality
- ✅ Period selector is visible and functional
- ✅ Can switch between different time periods
- ✅ Analytics data updates when period changes
- ✅ Selected period is maintained

### 5. Charts and Visualizations
- ✅ Trend charts are rendered (if data available)
- ✅ Category performance charts are displayed
- ✅ Productivity heatmap is visible
- ✅ Charts are responsive and interactive

### 6. Refresh Functionality
- ✅ Refresh button is visible and clickable
- ✅ Analytics data refreshes when button is clicked
- ✅ Loading states are handled properly
- ✅ Fresh data is displayed after refresh

### 7. Error Handling
- ✅ Error states are displayed gracefully
- ✅ Retry functionality is available
- ✅ Error messages are user-friendly
- ✅ Network errors are handled properly

### 8. Mobile Responsiveness
- ✅ Analytics dashboard works on mobile viewport
- ✅ Period selector is accessible on mobile
- ✅ Charts are readable on small screens
- ✅ Touch interactions work properly

## Test Configuration

### Timeouts
- **Test Suite Timeout**: 120 seconds
- **Element Wait Timeout**: 30 seconds
- **Implicit Wait**: 10 seconds

### Browser Options
- **Headless Mode**: Enabled by default
- **Window Size**: 1920x1080 (desktop), 375x667 (mobile)
- **Additional Chrome Options**: --no-sandbox, --disable-dev-shm-usage, --disable-gpu

### Grid Support
- Supports Selenium Grid for distributed testing
- Automatic driver management when using grid
- Remote execution capabilities

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Set
```
❌ Missing required environment variables: VITE_API_GATEWAY_URL, VITE_API_GATEWAY_KEY
```
**Solution**: Set all required environment variables before running tests.

#### 2. Browser Driver Not Found
```
⚠️ chromedriver not found in PATH
```
**Solution**: Install the appropriate browser driver or use Selenium Grid.

#### 3. Frontend Server Not Running
```
❌ Failed to start frontend server
```
**Solution**: Ensure port 5173 is available or start the server manually.

#### 4. Authentication Failed
```
❌ User authentication failed
```
**Solution**: Verify test user credentials and API Gateway configuration.

#### 5. Elements Not Found
```
⚠️ Analytics dashboard not found
```
**Solution**: Check if the analytics feature is properly implemented and deployed.

### Debug Mode

To run tests in debug mode with visible browser:

```powershell
.\scripts\run-quest-analytics-selenium-tests.ps1 -Headless:$false -Verbose
```

This will:
- Show the browser window during test execution
- Display detailed test output
- Allow you to see what's happening in real-time

### Logs and Screenshots

The tests automatically capture:
- Console logs from the browser
- Screenshots on test failures
- Network request/response details
- Element interaction logs

## Continuous Integration

For CI/CD pipelines, use the following configuration:

```yaml
# Example GitHub Actions workflow
- name: Run Quest Analytics Selenium Tests
  run: |
    $env:VITE_API_GATEWAY_URL = "${{ secrets.API_GATEWAY_URL }}"
    $env:VITE_API_GATEWAY_KEY = "${{ secrets.API_GATEWAY_KEY }}"
    $env:TEST_USER_EMAIL = "${{ secrets.TEST_USER_EMAIL }}"
    $env:TEST_USER_PASSWORD = "${{ secrets.TEST_USER_PASSWORD }}"
    .\scripts\run-quest-analytics-selenium-tests.ps1 -Browser chrome -Headless
```

## Contributing

When adding new test scenarios:

1. Follow the existing test structure
2. Add proper error handling
3. Include both positive and negative test cases
4. Update this README with new test coverage
5. Ensure tests are deterministic and reliable

## Support

For issues or questions about the Selenium tests:

1. Check the troubleshooting section above
2. Review the test logs and screenshots
3. Verify environment configuration
4. Test with different browsers and configurations
