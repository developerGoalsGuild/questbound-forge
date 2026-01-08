# GoalsGuild QuestBound Forge - Scripts

This directory contains automation scripts organized by purpose.

## Script Organization

### 🚀 [Deployment](./deployment/)
Scripts for deploying infrastructure and services.
- `deploy-all-stacks.ps1` - Master deployment script for all stacks
- `verify-goal-management-deployment.ps1` - Verification scripts

### 🧪 [Testing](./testing/)
Scripts for running tests and test automation.
- `run-*-tests.ps1` - Test execution scripts
- `test-*.ps1` - Test utility scripts
- `test-all.ps1` - Run all test suites

### 🛠️ [Development](./development/)
Development utilities and local setup scripts.
- Development environment setup
- Local development utilities

### 🏗️ [Infrastructure](./infrastructure/)
Infrastructure management and Terraform-related scripts.
- Infrastructure deployment scripts
- Resource management scripts

## Usage Examples

### Running Tests
```powershell
# Run all tests
.\scripts\testing\test-all.ps1

# Run specific test suite
.\scripts\testing\run-goal-progress-tests.ps1

# Run Selenium tests
.\scripts\testing\run-quest-analytics-selenium-tests.ps1
```

### Deployment
```powershell
# Deploy all stacks
.\scripts\deployment\deploy-all-stacks.ps1 -Env dev

# Verify deployment
.\scripts\deployment\verify-goal-management-deployment.ps1
```

## Script Requirements

Most scripts require:
- PowerShell 5.1 or later
- Node.js (for frontend-related scripts)
- Python 3.12+ (for backend-related scripts)
- AWS CLI configured (for deployment scripts)

## Environment Variables

Many scripts use environment variables for configuration:
- `BASE_URL` - Base URL for the application
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password
- `SELENIUM_GRID_URL` - Selenium Grid URL
- `VITE_API_GATEWAY_URL` - API Gateway URL
- `VITE_API_GATEWAY_KEY` - API Gateway key

## Best Practices

1. Always run scripts from the project root directory
2. Check prerequisites before running scripts
3. Review script output for errors
4. Use appropriate environment variables
5. Follow the script naming conventions

## Adding New Scripts

When adding new scripts:
1. Place them in the appropriate subdirectory
2. Follow existing naming conventions
3. Include error handling and logging
4. Document usage in script comments
5. Update this README if adding new categories

