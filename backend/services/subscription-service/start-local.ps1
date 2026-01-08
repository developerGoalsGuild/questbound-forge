# PowerShell script to start subscription service locally with proper configuration

Write-Host "Starting Subscription Service for Local Development" -ForegroundColor Green

# Navigate to service directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if virtual environment exists
if (Test-Path "venv") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
}

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow

# Required for authentication
$env:ENVIRONMENT = "dev"
$env:JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "dev-secret-key-for-local-testing-only" }
$env:JWT_AUDIENCE = if ($env:JWT_AUDIENCE) { $env:JWT_AUDIENCE } else { "api://default" }
$env:JWT_ISSUER = if ($env:JWT_ISSUER) { $env:JWT_ISSUER } else { "https://auth.local" }

# CORS configuration
$env:ALLOWED_ORIGINS = if ($env:ALLOWED_ORIGINS) { $env:ALLOWED_ORIGINS } else { "http://localhost:8080" }

# DynamoDB (optional for local testing)
$env:CORE_TABLE = if ($env:CORE_TABLE) { $env:CORE_TABLE } else { "gg_core" }
$env:COGNITO_REGION = if ($env:COGNITO_REGION) { $env:COGNITO_REGION } else { "us-east-2" }

# Do NOT set STRIPE_SECRET_KEY - this enables mock mode
if ($env:STRIPE_SECRET_KEY) {
    Write-Host "WARNING: STRIPE_SECRET_KEY is set. Mock mode will be disabled." -ForegroundColor Yellow
} else {
    Write-Host "Mock Stripe mode enabled (STRIPE_SECRET_KEY not set)" -ForegroundColor Green
}

# Logging
$env:LOG_LEVEL = if ($env:LOG_LEVEL) { $env:LOG_LEVEL } else { "INFO" }

Write-Host "`nConfiguration:" -ForegroundColor Cyan
Write-Host "  ENVIRONMENT: $env:ENVIRONMENT"
Write-Host "  JWT_SECRET: $($env:JWT_SECRET.Substring(0, [Math]::Min(20, $env:JWT_SECRET.Length)))..." 
Write-Host "  JWT_AUDIENCE: $env:JWT_AUDIENCE"
Write-Host "  JWT_ISSUER: $env:JWT_ISSUER"
Write-Host "  ALLOWED_ORIGINS: $env:ALLOWED_ORIGINS"
Write-Host "  CORE_TABLE: $env:CORE_TABLE"
Write-Host "  LOG_LEVEL: $env:LOG_LEVEL"
Write-Host ""

# Check if port is available
$port = 8001
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "WARNING: Port $port is already in use!" -ForegroundColor Red
    Write-Host "Please stop the service using port $port or change the port in this script." -ForegroundColor Yellow
    exit 1
}

# Check if dependencies are installed
if (-not (Get-Command uvicorn -ErrorAction SilentlyContinue)) {
    Write-Host "uvicorn not found. Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

Write-Host "Starting service on http://0.0.0.0:$port" -ForegroundColor Green
Write-Host "Health check: http://localhost:$port/health" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

# Start the service
try {
    uvicorn app.main:app --host 0.0.0.0 --port $port --reload --log-level $env:LOG_LEVEL.ToLower()
} catch {
    Write-Host "`nError starting service: $_" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure you're in the subscription-service directory"
    Write-Host "2. Install dependencies: pip install -r requirements.txt"
    Write-Host "3. Check that port $port is not in use"
    Write-Host "4. Verify Python 3.12+ is installed"
    exit 1
}















