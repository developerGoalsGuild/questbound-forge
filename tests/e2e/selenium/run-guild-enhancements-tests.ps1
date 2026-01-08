# PowerShell script to run Guild Enhancements Selenium Tests
# 
# This script sets up environment variables and runs the Selenium tests
# 
# Usage:
#   .\run-guild-enhancements-tests.ps1
#   .\run-guild-enhancements-tests.ps1 -Browser chrome
#   .\run-guild-enhancements-tests.ps1 -BaseUrl http://localhost:5173

param(
    [string]$Browser = "chrome",
    [string]$BaseUrl = "http://localhost:5173",
    [string]$SeleniumGridUrl = $null
)

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "=========================================="
Write-Info "Guild Enhancements Selenium Test Runner"
Write-Info "=========================================="
Write-Host ""

# Check if environment variables are set
if (-not $env:GOALSGUILD_USER) {
    Write-Error "ERROR: GOALSGUILD_USER environment variable is not set"
    Write-Info "Please set it using:"
    Write-Info "  `$env:GOALSGUILD_USER='your-email@example.com'"
    exit 1
}

if (-not $env:GOALSGUILD_PASSWORD) {
    Write-Error "ERROR: GOALSGUILD_PASSWORD environment variable is not set"
    Write-Info "Please set it using:"
    Write-Info "  `$env:GOALSGUILD_PASSWORD='your-password'"
    exit 1
}

Write-Success "✓ Environment variables validated"
Write-Info "  User: $($env:GOALSGUILD_USER)"
Write-Info "  Base URL: $BaseUrl"
Write-Info "  Browser: $Browser"
if ($SeleniumGridUrl) {
    Write-Info "  Selenium Grid: $SeleniumGridUrl"
}
Write-Host ""

# Check if Node.js is available
try {
    $nodeVersion = node -v
    Write-Success "✓ Node.js version: $nodeVersion"
} catch {
    Write-Error "ERROR: Node.js is not installed or not in PATH"
    exit 1
}

# Check if test file exists
$testFile = Join-Path $PSScriptRoot "guild-enhancements-selenium.test.js"
if (-not (Test-Path $testFile)) {
    Write-Error "ERROR: Test file not found: $testFile"
    exit 1
}

Write-Success "✓ Test file found: $testFile"
Write-Host ""

# Create directories for artifacts
$screenshotDir = Join-Path (Split-Path $PSScriptRoot -Parent) "screenshots"
$logDir = Join-Path (Split-Path $PSScriptRoot -Parent) "logs"

if (-not (Test-Path $screenshotDir)) {
    New-Item -ItemType Directory -Path $screenshotDir -Force | Out-Null
    Write-Info "Created screenshots directory: $screenshotDir"
}

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    Write-Info "Created logs directory: $logDir"
}

Write-Host ""
Write-Info "Starting test execution..."
Write-Info "=========================================="
Write-Host ""

# Set environment variables
$env:BASE_URL = $BaseUrl
$env:TEST_BROWSER = $Browser
if ($SeleniumGridUrl) {
    $env:SELENIUM_GRID_URL = $SeleniumGridUrl
}

# Change to test directory
Push-Location $PSScriptRoot

try {
    # Run the test
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $logFile = Join-Path $logDir "guild-enhancements-test_$timestamp.log"
    
    Write-Info "Log file: $logFile"
    Write-Host ""
    
    # Run node script and capture output
    $exitCode = 0
    node guild-enhancements-selenium.test.js 2>&1 | Tee-Object -FilePath $logFile
    
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    Write-Info "=========================================="
    if ($exitCode -eq 0) {
        Write-Success "✓ All tests completed successfully!"
    } else {
        Write-Error "✗ Tests failed with exit code: $exitCode"
    }
    Write-Info "=========================================="
    Write-Host ""
    Write-Info "Screenshots: $screenshotDir"
    Write-Info "Logs: $logFile"
    Write-Host ""
    
    exit $exitCode
} catch {
    Write-Error "Test execution failed: $_"
    exit 1
} finally {
    Pop-Location
}




