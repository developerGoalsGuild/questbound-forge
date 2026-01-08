# PowerShell script to run Selenium integration tests
$TS = Get-Date -Format "yyyyMMdd-HHmmss"
$LOG_FILE = "logs/testlogconsole_${TS}.log"

Write-Host "Starting Selenium integration tests..."
Write-Host "Timestamp: $TS"
Write-Host "Log file: $LOG_FILE"

# Set environment variables if not already set
if (-not $env:SELENIUM_GRID_URL) { $env:SELENIUM_GRID_URL = "http://localhost:4444/wd/hub" }
if (-not $env:BASE_URL) { $env:BASE_URL = "http://localhost:8080" }
if (-not $env:GOALSGUILD_USER) { $env:GOALSGUILD_USER = "test@example.com" }
if (-not $env:GOALSGUILD_PASSWORD) { $env:GOALSGUILD_PASSWORD = "testpassword" }

Write-Host "Environment variables:"
Write-Host "SELENIUM_GRID_URL: $env:SELENIUM_GRID_URL"
Write-Host "BASE_URL: $env:BASE_URL"
Write-Host "GOALSGUILD_USER: $env:GOALSGUILD_USER"
Write-Host "GOALSGUILD_PASSWORD: [REDACTED]"

# Run the tests and capture output to log file
try {
    # Run the command and capture output using cmd.exe to handle redirection properly
    $cmd = "node tests/integration/seleniumGridTests.js >> `"$LOG_FILE`" 2>&1"
    cmd /c $cmd
    $exitCode = $LASTEXITCODE
} catch {
    Write-Host "Error running tests: $_"
    $exitCode = 1
}

Write-Host "Test execution completed with exit code: $exitCode"

# Analyze results
$result = @{
    status = if ($exitCode -eq 0) { "passed" } else { "failed" }
    exit_code = $exitCode
    grid_url = $env:SELENIUM_GRID_URL
    base_url = $env:BASE_URL
    log_file = $LOG_FILE
    screenshot_paths = @()
}

if ($exitCode -ne 0) {
    Write-Host "Tests failed. Analyzing logs..."

    # Try to capture screenshot (if script supports it)
    $screenshotPath = "screenshots/failure_${TS}.png"
    # Note: Screenshot capture would need to be implemented in the test script or a separate utility

    # Analyze the log file
    if (Test-Path $LOG_FILE) {
        $logContent = Get-Content $LOG_FILE -Tail 300
        $errorLines = $logContent | Select-String -Pattern "ERROR|FAIL|Error|Exception" | Select-Object -First 10

        $result.error_summary = @{
            failing_test_names = @()
            key_error_lines = $errorLines.Line
            probable_root_cause = "Test execution failed - check log for details"
            suggested_fixes = @("Check Selenium Grid connectivity", "Verify BASE_URL is accessible", "Ensure test credentials are valid")
        }
    }
}

# Output results in structured format
$result | ConvertTo-Json -Depth 10
