# PowerShell script to run Selenium Grid integration tests on Windows

# Usage:
#   .\scripts\run-selenium-tests.ps1

# Ensure environment variables are set in your PowerShell session:
# $env:SELENIUM_GRID_URL = "http://localhost:4444/wd/hub"


Write-Host "Running Selenium Grid integration tests..."

# Run the Node.js test scripts
Write-Host "Running Selenium Grid integration tests..." -ForegroundColor Cyan

# Run goal creation tests
Write-Host "Running goal creation tests..." -ForegroundColor Yellow
node --trace-warnings .\tests\integration\goalCreationTest.js
$goalCreationExitCode = $LASTEXITCODE

# Run goal edit tests
Write-Host "Running goal edit tests..." -ForegroundColor Yellow
node --trace-warnings .\tests\integration\goalEditTest.js
$goalEditExitCode = $LASTEXITCODE

# Run task management tests
Write-Host "Running task management tests..." -ForegroundColor Yellow
node --trace-warnings .\tests\integration\taskManagementTest.js
$taskManagementExitCode = $LASTEXITCODE

# Run profile edit tests
Write-Host "Running profile edit tests..." -ForegroundColor Yellow
node --trace-warnings .\tests\integration\editProfileTest.js
$profileTestsExitCode = $LASTEXITCODE

# Check results
if ($goalCreationExitCode -eq 0 -and $goalEditExitCode -eq 0 -and $taskManagementExitCode -eq 0 -and $profileTestsExitCode -eq 0) {
  Write-Host "All tests completed successfully." -ForegroundColor Green
  exit 0
} else {
  Write-Error "Some tests failed. Goal creation: $goalCreationExitCode, Goal edit: $goalEditExitCode, Task management: $taskManagementExitCode, Profile tests: $profileTestsExitCode"
  exit 1
}
