# Guild Enhancements Selenium Tests

## Overview

This directory contains Selenium E2E tests for guild enhancements, following the test plan in `docs/testing/GUILD_ENHANCEMENTS_TEST_PLAN.md`.

## Prerequisites

- Node.js 18+ installed
- Selenium WebDriver dependencies installed
- Chrome/Firefox/Edge browser installed
- Environment variables set (see below)

## Installation

```bash
# Install dependencies
npm install selenium-webdriver

# For Chrome
npm install selenium-webdriver/chrome

# For Firefox
npm install selenium-webdriver/firefox

# For Edge
npm install selenium-webdriver/edge
```

## Environment Variables

Set the following environment variables before running tests:

### Windows PowerShell
```powershell
$env:GOALSGUILD_USER="your-email@example.com"
$env:GOALSGUILD_PASSWORD="your-password"
$env:BASE_URL="http://localhost:5173"  # Optional
$env:SELENIUM_GRID_URL="http://localhost:4444/wd/hub"  # Optional
$env:TEST_BROWSER="chrome"  # Optional: chrome, firefox, edge
```

### Windows CMD
```cmd
set GOALSGUILD_USER=your-email@example.com
set GOALSGUILD_PASSWORD=your-password
set BASE_URL=http://localhost:5173
```

### Linux/macOS
```bash
export GOALSGUILD_USER="your-email@example.com"
export GOALSGUILD_PASSWORD="your-password"
export BASE_URL="http://localhost:5173"
```

## Running Tests

### Run All Tests
```bash
node tests/selenium/guild-enhancements-selenium.test.js
```

### With Selenium Grid
```bash
$env:SELENIUM_GRID_URL="http://localhost:4444/wd/hub"
node tests/selenium/guild-enhancements-selenium.test.js
```

### Different Browser
```bash
$env:TEST_BROWSER="firefox"
node tests/selenium/guild-enhancements-selenium.test.js
```

## Test Coverage

The test script covers the following test cases from the test plan:

### ✅ Auto-Calculated Quest Rewards
- **GUILD-REWARD-003**: Verify auto-calculated XP displays in create form
- Verifies reward field is read-only
- Checks for "Auto-calculated" indicators

### ✅ Goal References Removal
- **GUILD-GOAL-REMOVAL-001**: Verify quantitative quest form has correct goal references
- **GUILD-GOAL-REMOVAL-002**: Verify percentual quest form has correct goal references
- **GUILD-GOAL-REMOVAL-004**: Verify guild rankings show no goal metrics
- **GUILD-GOAL-REMOVAL-005**: Verify guild details page shows no goal stats
- **GUILD-GOAL-REMOVAL-006**: Verify analytics dashboard shows no goal metrics

### ✅ Localization
- Tests Spanish (ES) translations
- Verifies "User Goals (from members)" labels

## Test Output

### Screenshots
Screenshots are automatically saved to `tests/screenshots/` directory:
- `login-success.png` - After successful login
- `guilds-page.png` - Guilds listing page
- `guild-details.png` - Guild details page
- `analytics-dashboard-no-goals.png` - Analytics verification
- `quantitative-quest-form-verified.png` - Form validation
- And more...

### Console Output
The test script provides detailed console output:
- ✅ Success indicators
- ❌ Error messages
- ⚠️  Warnings
- 📸 Screenshot notifications
- 📊 Test summary at the end

## Test Results

The script exits with:
- **Exit code 0**: All tests passed
- **Exit code 1**: One or more tests failed

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure `GOALSGUILD_USER` and `GOALSGUILD_PASSWORD` are set
   - Check environment variable names are correct

2. **"Element not found"**
   - Page may have different selectors
   - Check screenshot for current page state
   - Verify base URL is correct

3. **"Authentication failed"**
   - Verify credentials are correct
   - Check if user account exists
   - Verify login page is accessible

4. **"Selenium Grid connection failed"**
   - Ensure Selenium Grid is running
   - Check Grid URL is correct
   - Verify network connectivity

### Debug Mode

To run with more verbose output:
```bash
DEBUG=* node tests/selenium/guild-enhancements-selenium.test.js
```

### Manual Verification

If tests fail, check screenshots in `tests/screenshots/` to see what the page looked like at the time of failure.

## Integration with CI/CD

The test script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Guild Enhancements Tests
  env:
    GOALSGUILD_USER: ${{ secrets.TEST_USER_EMAIL }}
    GOALSGUILD_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    BASE_URL: ${{ secrets.FRONTEND_URL }}
  run: |
    node tests/selenium/guild-enhancements-selenium.test.js
```

## Related Documentation

- [Test Plan](../docs/testing/GUILD_ENHANCEMENTS_TEST_PLAN.md)
- [Guild Quest Design](../../docs/features/plan/GUILD_QUEST_DESIGN.md)
- [Selenium Grid Setup](../../docs/selenium-grid-windows-setup.md)

## Additional Test Suites

- **Subscription Tests**: See [README_SUBSCRIPTION.md](./README_SUBSCRIPTION.md) for subscription feature tests




