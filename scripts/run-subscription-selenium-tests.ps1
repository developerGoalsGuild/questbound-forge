# PowerShell script to run Subscription Selenium integration tests
param(
    [string]$Browser = "chrome",
    [string]$GridUrl = "",
    [switch]$Headless = $true,
    [switch]$Verbose = $false
)

$TS = Get-Date -Format "yyyyMMdd-HHmmss"
$LOG_FILE = "logs/subscription-selenium-tests_${TS}.log"

Write-Host "Starting Subscription Selenium integration tests..." -ForegroundColor Green
Write-Host "Timestamp: $TS"
Write-Host "Log file: $LOG_FILE"
Write-Host ""

# Ensure logs directory exists
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Set environment variables if not already set
if (-not $env:GOALSGUILD_USER) {
    Write-Host "⚠️  GOALSGUILD_USER not set. Please set it before running tests." -ForegroundColor Yellow
    Write-Host "   Example: `$env:GOALSGUILD_USER = 'test@example.com'" -ForegroundColor Yellow
}

if (-not $env:GOALSGUILD_PASSWORD) {
    Write-Host "⚠️  GOALSGUILD_PASSWORD not set. Please set it before running tests." -ForegroundColor Yellow
    Write-Host "   Example: `$env:GOALSGUILD_PASSWORD = 'your-password'" -ForegroundColor Yellow
}

if (-not $env:BASE_URL) {
    $env:BASE_URL = "http://localhost:5173"
    Write-Host "ℹ️  BASE_URL not set, using default: $env:BASE_URL" -ForegroundColor Cyan
}

if ($GridUrl) {
    $env:SELENIUM_GRID_URL = $GridUrl.Trim()
    Write-Host "ℹ️  Using Selenium Grid: $GridUrl" -ForegroundColor Cyan
} else {
    # Clear SELENIUM_GRID_URL if not provided to avoid invalid URLs
    $env:SELENIUM_GRID_URL = $null
}

$env:TEST_BROWSER = $Browser

if ($Headless) {
    $env:HEADLESS = "true"
} else {
    $env:HEADLESS = "false"
}

Write-Host "Environment variables:" -ForegroundColor Cyan
Write-Host "  BASE_URL: $env:BASE_URL"
Write-Host "  TEST_BROWSER: $env:TEST_BROWSER"
if ($env:SELENIUM_GRID_URL) {
    Write-Host "  SELENIUM_GRID_URL: $env:SELENIUM_GRID_URL"
}
Write-Host "  HEADLESS: $env:HEADLESS"
Write-Host "  GOALSGUILD_USER: $env:GOALSGUILD_USER"
Write-Host "  GOALSGUILD_PASSWORD: [REDACTED]"
Write-Host ""

# Check if test file exists
$testFile = "tests/selenium/subscription-selenium.test.js"
if (-not (Test-Path $testFile)) {
    Write-Host "❌ Test file not found: $testFile" -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ to run tests." -ForegroundColor Red
    exit 1
}

# Run the tests
Write-Host "Running subscription tests..." -ForegroundColor Green
Write-Host ""

try {
    if ($Verbose) {
        node $testFile 2>&1 | Tee-Object -FilePath $LOG_FILE
    } else {
        node $testFile 2>&1 | Tee-Object -FilePath $LOG_FILE | Out-Null
        Get-Content $LOG_FILE | Write-Host
    }
    
    $exitCode = $LASTEXITCODE
} catch {
    Write-Host "❌ Error running tests: $_" -ForegroundColor Red
    $exitCode = 1
}

Write-Host ""
Write-Host "=" * 60
Write-Host "Test execution completed with exit code: $exitCode" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })
Write-Host "Log file: $LOG_FILE"

# Check for screenshots
$screenshotDir = "tests/screenshots"
if (Test-Path $screenshotDir) {
    $screenshots = Get-ChildItem -Path $screenshotDir -Filter "subscription_*.png" | Sort-Object LastWriteTime -Descending
    if ($screenshots.Count -gt 0) {
        Write-Host ""
        Write-Host "📸 Screenshots captured:" -ForegroundColor Cyan
        $screenshots | Select-Object -First 5 | ForEach-Object {
            Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1KB, 2)) KB)"
        }
    }
}

# Analyze results
if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "❌ Tests failed. Analyzing logs..." -ForegroundColor Red
    
    if (Test-Path $LOG_FILE) {
        $logContent = Get-Content $LOG_FILE -Tail 50
        $errorLines = $logContent | Select-String -Pattern "ERROR|FAIL|Error|Exception|❌" | Select-Object -First 10
        
        if ($errorLines) {
            Write-Host ""
            Write-Host "Key errors found:" -ForegroundColor Yellow
            $errorLines | ForEach-Object {
                Write-Host "  - $($_.Line)" -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
        Write-Host "Suggested fixes:" -ForegroundColor Cyan
        Write-Host "  1. Check that frontend is running on $env:BASE_URL"
        Write-Host "  2. Verify GOALSGUILD_USER and GOALSGUILD_PASSWORD are correct"
        Write-Host "  3. Ensure subscription UI components are implemented"
        Write-Host "  4. Check screenshots in $screenshotDir for visual debugging"
        Write-Host "  5. Review full log: $LOG_FILE"
    }
}

Write-Host ""
exit $exitCode

