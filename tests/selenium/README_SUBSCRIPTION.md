# Subscription Features Selenium Tests

This directory contains Selenium E2E tests for subscription features, following the test plan for subscription functionality.

## Overview

These tests verify the end-to-end functionality of subscription features including:
- Subscription plans selection and display
- Subscription checkout flow
- Credit balance display and management
- Subscription cancellation
- Billing portal access
- Founder pass purchase flow

## Prerequisites

- Node.js 18+ installed
- Selenium WebDriver dependencies installed
- Chrome/Firefox/Edge browser installed
- Environment variables set (see below)

## Installation

```bash
# Install dependencies (if not already installed)
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
$env:API_GATEWAY_URL="https://api.goalsguild.com"  # Optional
$env:API_GATEWAY_KEY="your-api-key"  # Optional
$env:SELENIUM_GRID_URL="http://localhost:4444/wd/hub"  # Optional
$env:TEST_BROWSER="chrome"  # Optional: chrome, firefox, edge
$env:HEADLESS="true"  # Optional: true, false (default: true)
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
node tests/selenium/subscription-selenium.test.js
```

### With Selenium Grid
```bash
$env:SELENIUM_GRID_URL="http://localhost:4444/wd/hub"
node tests/selenium/subscription-selenium.test.js
```

### Different Browser
```bash
$env:TEST_BROWSER="firefox"
node tests/selenium/subscription-selenium.test.js
```

### Non-Headless Mode (Visible Browser)
```bash
$env:HEADLESS="false"
node tests/selenium/subscription-selenium.test.js
```

## Test Coverage

The test script covers the following subscription features:

### ✅ Subscription Plans Display
- Verifies subscription plans page loads
- Checks for plan cards/tiers (INITIATE, JOURNEYMAN, SAGE, GUILDMASTER)
- Validates plan information display

### ✅ Credit Balance Display
- Checks for credit balance on profile/dashboard pages
- Verifies credit balance element visibility
- Tests credit display in different locations

### ✅ Subscription Checkout Flow
- Tests navigation to subscription plans
- Verifies subscription button functionality
- Checks checkout page/modal appearance
- Tests payment flow initiation

### ✅ Billing Portal
- Tests navigation to billing/account settings
- Verifies billing portal link/button
- Tests portal access and redirect

### ✅ Subscription Cancellation
- Tests navigation to subscription management
- Verifies cancel subscription option availability
- Checks cancellation UI elements

### ✅ API Health Check
- Tests subscription service health endpoint
- Verifies API connectivity
- Validates API response format

## Test Structure

### Test Flow
1. **Setup**: Create WebDriver instance
2. **Login**: Authenticate test user
3. **API Health Check**: Verify backend connectivity
4. **Plans Display**: Test subscription plans page
5. **Credit Balance**: Test credit display
6. **Checkout**: Test subscription purchase flow
7. **Billing Portal**: Test billing management
8. **Cancellation**: Test subscription cancellation UI

### Screenshots
Tests automatically capture screenshots at key points:
- `00_initial_setup.png` - Initial page load
- `01_login_page.png` - Login page
- `02_login_credentials_entered.png` - Before submit
- `03_logged_in.png` - After successful login
- `04_subscription_plans_page.png` - Plans page
- `05_subscription_plans_displayed.png` - Plans visible
- `06_credit_balance_*.png` - Credit balance pages
- `07_checkout_initiated.png` - Checkout started
- `08_checkout_page.png` - Checkout page/modal
- `09_billing_page_*.png` - Billing pages
- `10_billing_portal_accessed.png` - Portal accessed
- `11_cancellation_page_*.png` - Cancellation pages
- `12_cancel_button_found.png` - Cancel button visible
- `99_tests_completed.png` - Test completion

Screenshots are saved to `tests/screenshots/` directory.

## Troubleshooting

### Tests Fail with "Element not found"
- Ensure frontend is running on the BASE_URL
- Check that subscription UI components are implemented
- Verify page routes match expected paths
- Some tests may fail if components aren't built yet (expected)

### Login Fails
- Verify GOALSGUILD_USER and GOALSGUILD_PASSWORD are correct
- Check that login page is accessible
- Ensure login form selectors match actual page structure

### Screenshots Not Saved
- Check that `tests/screenshots/` directory exists or can be created
- Verify write permissions for the directory

### Browser Not Starting
- Ensure browser driver is installed and in PATH
- For Chrome: Install chromedriver
- For Firefox: Install geckodriver
- For Edge: Install msedgedriver

### Selenium Grid Connection Fails
- Verify Selenium Grid is running
- Check SELENIUM_GRID_URL is correct
- Ensure Grid is accessible from test machine

## Notes

### Component Implementation Status
Some tests may fail initially if subscription UI components are not yet implemented. This is expected and tests should be updated as components are built:

- Subscription plans page (`/subscription`, `/subscriptions`, `/pricing`)
- Credit balance component (in profile/dashboard)
- Checkout flow (modal or page)
- Billing portal integration
- Subscription management UI

### Mock vs Real Payments
- Tests use mock Stripe in dev environment
- No real payment processing occurs
- Checkout flow tests verify UI only

### Test Data
- Tests use real user credentials from environment variables
- Test user should have appropriate permissions
- Consider using a dedicated test account

## Future Enhancements

- Add tests for founder pass purchase flow
- Test credit top-up functionality
- Test subscription tier upgrades/downgrades
- Add accessibility testing for subscription forms
- Test mobile responsive subscription UI
- Add performance testing for subscription pages

