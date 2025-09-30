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
node --trace-warnings .\tests\integration\seleniumGridTests.js
$goalTestsExitCode = $LASTEXITCODE

# Run profile edit tests
Write-Host "Running profile edit tests..." -ForegroundColor Yellow
node --trace-warnings .\tests\integration\editProfileTest.js
$profileTestsExitCode = $LASTEXITCODE

# Check results
if ($goalTestsExitCode -eq 0 -and $profileTestsExitCode -eq 0) {
  Write-Host "All tests completed successfully." -ForegroundColor Green
  exit 0
} else {
  Write-Error "Some tests failed. Goal tests: $goalTestsExitCode, Profile tests: $profileTestsExitCode"
  exit 1
}
