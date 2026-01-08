# Quest Service Environment Variables Verification Script
# This script verifies that all required environment variables are set correctly

Write-Host "Verifying Quest Service Environment Variables..." -ForegroundColor Green

# Function to check environment variable
function Test-EnvVar {
    param(
        [string]$Name,
        [string]$ExpectedValue = $null,
        [bool]$Required = $true
    )
    
    $value = [Environment]::GetEnvironmentVariable($Name, "User")
    $processValue = [Environment]::GetEnvironmentVariable($Name, "Process")
    
    if ($value) {
        if ($ExpectedValue -and $value -ne $ExpectedValue) {
            Write-Host "Warning: $Name = $value (expected: $ExpectedValue)" -ForegroundColor Yellow
        } else {
            Write-Host "Set $Name = $value" -ForegroundColor Green
        }
    } elseif ($processValue) {
        Write-Host "Process only $Name = $processValue" -ForegroundColor Yellow
    } elseif ($Required) {
        Write-Host "Not set $Name (REQUIRED)" -ForegroundColor Red
    } else {
        Write-Host "Not set $Name (optional)" -ForegroundColor Gray
    }
}

Write-Host "`nAWS Configuration:" -ForegroundColor Cyan
Write-Host "AWS credentials should be set via AWS credentials file (~/.aws/credentials)" -ForegroundColor Blue
Test-EnvVar "AWS_DEFAULT_REGION" "us-east-2"
Test-EnvVar "AWS_REGION" "us-east-2"

Write-Host "`nDynamoDB Configuration:" -ForegroundColor Cyan
Test-EnvVar "CORE_TABLE" "gg_core_temp"
Test-EnvVar "AWS_ENDPOINT_URL" "http://localhost:8000"

Write-Host "`nQuest Service Configuration:" -ForegroundColor Cyan
Test-EnvVar "QUEST_SERVICE_ROOT_PATH" "/DEV"
Test-EnvVar "QUEST_LOG_ENABLED" "true"
Test-EnvVar "SETTINGS_SSM_PREFIX" "/goalsguild/quest-service/"

Write-Host "`nAuthentication Configuration:" -ForegroundColor Cyan
Test-EnvVar "JWT_AUDIENCE" "api://test"
Test-EnvVar "JWT_ISSUER" "https://auth.test"
Test-EnvVar "COGNITO_REGION" "us-east-2"
Test-EnvVar "COGNITO_USER_POOL_ID" "test-pool"
Test-EnvVar "COGNITO_CLIENT_ID" "test-client"
Test-EnvVar "ALLOWED_ORIGINS" "http://localhost:8080"
Test-EnvVar "QUEST_SERVICE_JWT_SECRET" "test-secret-key-for-development-only"

Write-Host "`nTest Configuration:" -ForegroundColor Cyan
Test-EnvVar "TEST_CORE_TABLE" "gg_core_temp" $false
Test-EnvVar "TEST_AWS_REGION" "us-east-2" $false
Test-EnvVar "TEST_USER_ID" "test-user-123" $false

Write-Host "`nAuthentication Configuration for Tests (set manually):" -ForegroundColor Cyan
Write-Host "These variables should be set manually in your environment:" -ForegroundColor Blue
Write-Host "   - GOALSGUILD_USER" -ForegroundColor White
Write-Host "   - GOALSGUILD_PASSWORD" -ForegroundColor White
Write-Host "   - VITE_API_GATEWAY_URL" -ForegroundColor White
Write-Host "   - VITE_API_GATEWAY_KEY" -ForegroundColor White
Write-Host "   - QUEST_SERVICE_JWT_SECRET" -ForegroundColor White
Write-Host "   - QUEST_SERVICE_ENV_VARS" -ForegroundColor White

Write-Host "`nTesting Python Import:" -ForegroundColor Cyan
try {
    # Create a temporary Python script file
    $pythonScript = @"
import os
import sys
from pathlib import Path

# Add quest-service directory to path
quest_service_dir = Path('.').resolve()
if str(quest_service_dir) not in sys.path:
    sys.path.insert(0, str(quest_service_dir))

try:
    from app.settings import Settings
    settings = Settings()
    print('Settings loaded successfully')
    print(f'   CORE_TABLE: {settings.core_table_name}')
    print(f'   AWS_REGION: {settings.aws_region}')
except Exception as e:
    print(f'Settings error: {e}')
    sys.exit(1)

try:
    from app.db.quest_db import _get_dynamodb_table
    print('Quest DB module imported successfully')
except Exception as e:
    print(f'Quest DB import error: {e}')
    sys.exit(1)
"@
    
    $tempScript = [System.IO.Path]::GetTempFileName() + ".py"
    $pythonScript | Out-File -FilePath $tempScript -Encoding UTF8
    
    try {
        $pythonTest = python $tempScript 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host $pythonTest -ForegroundColor Green
        } else {
            Write-Host $pythonTest -ForegroundColor Red
        }
    } finally {
        Remove-Item $tempScript -ErrorAction SilentlyContinue
    }
} catch {
    Write-Host "Python test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTesting AWS Connection:" -ForegroundColor Cyan
try {
    $awsTest = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "AWS credentials working" -ForegroundColor Green
        Write-Host $awsTest -ForegroundColor Green
    } else {
        Write-Host "AWS credentials test failed - check your AWS credentials file" -ForegroundColor Yellow
        Write-Host $awsTest -ForegroundColor Yellow
    }
} catch {
    Write-Host "AWS CLI not available or credentials not working" -ForegroundColor Yellow
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "Green: Correctly configured" -ForegroundColor Green
Write-Host "Yellow: Process-only or different value" -ForegroundColor Yellow
Write-Host "Red: Missing required variable" -ForegroundColor Red
Write-Host "Gray: Optional variable not set" -ForegroundColor Gray

Write-Host "`nRecommendations:" -ForegroundColor Yellow
Write-Host "1. If you see red, run the setup script again" -ForegroundColor White
Write-Host "2. If you see yellow, restart your terminal" -ForegroundColor White
Write-Host "3. Set up AWS credentials using 'aws configure' or credentials file" -ForegroundColor White
Write-Host "4. For local testing, consider using DynamoDB Local" -ForegroundColor White

Write-Host "`nVerification complete!" -ForegroundColor Green
