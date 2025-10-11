# Quest Analytics Selenium Test Runner
# This script runs the Selenium integration tests for the Quest Analytics feature
# using environment variables for authentication and configuration.

param(
    [string]$Browser = "chrome",
    [string]$GridUrl = "",
    [switch]$Headless = $true,
    [switch]$Verbose = $false
)

Write-Host "🚀 Starting Quest Analytics Selenium Tests..." -ForegroundColor Green

# Check if required environment variables are set
$requiredEnvVars = @(
    "VITE_API_GATEWAY_URL",
    "VITE_API_GATEWAY_KEY", 
    "TEST_USER_EMAIL",
    "TEST_USER_PASSWORD"
)

$missingVars = @()
foreach ($var in $requiredEnvVars) {
    if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please set these environment variables before running the tests." -ForegroundColor Yellow
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host "  `$env:VITE_API_GATEWAY_URL = 'https://your-api-gateway-url.com'" -ForegroundColor Cyan
    Write-Host "  `$env:VITE_API_GATEWAY_KEY = 'your-api-key'" -ForegroundColor Cyan
    Write-Host "  `$env:TEST_USER_EMAIL = 'test@example.com'" -ForegroundColor Cyan
    Write-Host "  `$env:TEST_USER_PASSWORD = 'your-password'" -ForegroundColor Cyan
    exit 1
}

# Set additional environment variables for Selenium
$env:TEST_BROWSER = $Browser
if ($GridUrl) {
    $env:SELENIUM_GRID_URL = $GridUrl
}

if ($Headless) {
    $env:SELENIUM_HEADLESS = "true"
} else {
    $env:SELENIUM_HEADLESS = "false"
}

Write-Host "✅ Environment variables validated" -ForegroundColor Green
Write-Host "🌐 Browser: $Browser" -ForegroundColor Cyan
Write-Host "🔧 Headless: $Headless" -ForegroundColor Cyan
if ($GridUrl) {
    Write-Host "🌐 Grid URL: $GridUrl" -ForegroundColor Cyan
}

# Navigate to frontend directory
$frontendPath = Join-Path $PSScriptRoot ".." "frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Frontend directory not found at: $frontendPath" -ForegroundColor Red
    exit 1
}

Set-Location $frontendPath
Write-Host "📁 Changed to frontend directory: $frontendPath" -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check if Selenium WebDriver is installed
Write-Host "🔍 Checking Selenium WebDriver installation..." -ForegroundColor Yellow
$seleniumInstalled = $false
try {
    $seleniumCheck = npm list selenium-webdriver 2>$null
    if ($seleniumCheck -match "selenium-webdriver") {
        $seleniumInstalled = $true
    }
} catch {
    # Selenium not installed
}

if (-not $seleniumInstalled) {
    Write-Host "📦 Installing Selenium WebDriver..." -ForegroundColor Yellow
    npm install --save-dev selenium-webdriver
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Selenium WebDriver" -ForegroundColor Red
        exit 1
    }
}

# Check if browser drivers are available
Write-Host "🔍 Checking browser driver availability..." -ForegroundColor Yellow
$driverCheck = @{
    "chrome" = "chromedriver"
    "firefox" = "geckodriver" 
    "edge" = "msedgedriver"
}

$driverName = $driverCheck[$Browser]
if (-not $driverName) {
    Write-Host "❌ Unsupported browser: $Browser" -ForegroundColor Red
    Write-Host "Supported browsers: chrome, firefox, edge" -ForegroundColor Yellow
    exit 1
}

# Check if driver is in PATH
$driverInPath = $false
try {
    $null = Get-Command $driverName -ErrorAction Stop
    $driverInPath = $true
} catch {
    # Driver not in PATH
}

if (-not $driverInPath) {
    Write-Host "⚠️  $driverName not found in PATH" -ForegroundColor Yellow
    Write-Host "Please install $driverName and add it to your PATH" -ForegroundColor Yellow
    Write-Host "Or use a Selenium Grid by specifying -GridUrl parameter" -ForegroundColor Yellow
    
    if (-not $GridUrl) {
        Write-Host "❌ Cannot run tests without driver or grid" -ForegroundColor Red
        exit 1
    }
}

# Start the frontend development server if not running
Write-Host "🌐 Checking if frontend server is running..." -ForegroundColor Yellow
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
        Write-Host "✅ Frontend server is already running" -ForegroundColor Green
    }
} catch {
    # Server not running
}

if (-not $serverRunning) {
    Write-Host "🚀 Starting frontend development server..." -ForegroundColor Yellow
    Write-Host "This will start the server in the background..." -ForegroundColor Cyan
    
    $serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 10
    
    # Check if server started successfully
    $maxRetries = 30
    $retryCount = 0
    while ($retryCount -lt $maxRetries) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $serverRunning = $true
                break
            }
        } catch {
            # Server not ready yet
        }
        Start-Sleep -Seconds 2
        $retryCount++
    }
    
    if (-not $serverRunning) {
        Write-Host "❌ Failed to start frontend server" -ForegroundColor Red
        if ($serverProcess -and -not $serverProcess.HasExited) {
            $serverProcess.Kill()
        }
        exit 1
    }
    
    Write-Host "✅ Frontend server started successfully" -ForegroundColor Green
}

# Run the Selenium tests
Write-Host "🧪 Running Quest Analytics Selenium tests..." -ForegroundColor Green
Write-Host ""

$testCommand = "npx mocha src/__tests__/selenium/quest-analytics-selenium.test.js --timeout 120000"
if ($Verbose) {
    $testCommand += " --reporter spec"
} else {
    $testCommand += " --reporter dot"
}

Write-Host "Executing: $testCommand" -ForegroundColor Cyan
Write-Host ""

try {
    Invoke-Expression $testCommand
    $testExitCode = $LASTEXITCODE
    
    if ($testExitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ All Quest Analytics Selenium tests passed!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Some tests failed (exit code: $testExitCode)" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running tests: $($_.Exception.Message)" -ForegroundColor Red
    $testExitCode = 1
}

# Cleanup: Stop the development server if we started it
if ($serverProcess -and -not $serverProcess.HasExited) {
    Write-Host ""
    Write-Host "🧹 Stopping development server..." -ForegroundColor Yellow
    $serverProcess.Kill()
    $serverProcess.WaitForExit(5000)
    Write-Host "✅ Development server stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏁 Quest Analytics Selenium test run completed" -ForegroundColor Green

exit $testExitCode
