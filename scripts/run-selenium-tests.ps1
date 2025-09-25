# PowerShell script to run Selenium Grid integration tests on Windows

# Usage:
#   .\scripts\run-selenium-tests.ps1

# Ensure environment variables are set in your PowerShell session:
# $env:SELENIUM_GRID_URL = "http://localhost:4444/wd/hub"


Write-Host "Running Selenium Grid integration tests..."

# Run the Node.js test script
node --trace-warnings .\tests\integration\seleniumGridTests.js  

if ($LASTEXITCODE -eq 0) {
  Write-Host "All tests completed successfully."
  exit 0
} else {
  Write-Error "Test script failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}
