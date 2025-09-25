# PowerShell script to run Task Creation and Visualization integration tests on Windows

# Usage:
#   .\scripts\run-task-tests.ps1

# Ensure environment variables are set in your PowerShell session:
# $env:SELENIUM_GRID_URL = "http://localhost:4444/wd/hub"
# $env:BASE_URL = "http://localhost:8080"
# $env:TEST_USER_EMAIL = "your-test-email@example.com"
# $env:TEST_USER_PASSWORD = "your-test-password"
# $env:OLLAMA_API_URL = "http://localhost:5001"

Write-Host "Running Task Creation and Visualization integration tests..."

# Run the Node.js test script
node --trace-warnings .\tests\integration\taskCreationAndVisualizationTests.js

if ($LASTEXITCODE -eq 0) {
  Write-Host "All tests completed successfully."
  exit 0
} else {
  Write-Error "Test script failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}
