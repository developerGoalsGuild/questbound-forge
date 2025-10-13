# Collaboration Service Environment Variables Setup Script
# This script sets up AWS SSM parameters for the collaboration service

param(
    [string]$Environment = "dev",
    [string]$Region = "us-east-2",
    [switch]$DryRun
)

Write-Host "Setting up Collaboration Service Environment Variables for $Environment..." -ForegroundColor Green

# Environment variables as JSON for SSM
$envVarsJson = @"
{
  "CORE_TABLE": "gg_core",
  "JWT_AUDIENCE": "api://test",
  "JWT_ISSUER": "https://auth.test",
  "DYNAMODB_TABLE_NAME": "gg_core",
  "AWS_REGION": "$Region",
  "ENVIRONMENT": "$Environment",
  "LOG_LEVEL": "INFO",
  "CORS_MAX_AGE": "3600",
  "RATE_LIMIT_REQUESTS_PER_HOUR": "1000",
  "CACHE_TTL_SECONDS": "300",
  "MAX_INVITES_PER_USER_PER_HOUR": "20",
  "MAX_COMMENTS_PER_USER_PER_HOUR": "100"
}
"@

Write-Host "Environment Variables JSON:" -ForegroundColor Yellow
Write-Host $envVarsJson
Write-Host ""

$ssmPath = "/goalsguild/collaboration-service/env_vars"

if ($DryRun) {
    Write-Host "DRY RUN - Would create SSM parameter:" -ForegroundColor Cyan
    Write-Host "Path: $ssmPath" -ForegroundColor Cyan
    Write-Host "Value: $envVarsJson" -ForegroundColor Cyan
    return
}

try {
    # Create SSM parameter
    $result = aws ssm put-parameter `
        --name $ssmPath `
        --value $envVarsJson `
        --type "String" `
        --description "Collaboration Service Environment Variables for $Environment" `
        --overwrite `
        --region $Region

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully created SSM parameter: $ssmPath" -ForegroundColor Green

        # Verify the parameter was created
        Write-Host "Verifying SSM parameter..." -ForegroundColor Yellow
        $verify = aws ssm get-parameter `
            --name $ssmPath `
            --region $Region `
            --query "Parameter.Value" `
            --output text

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SSM parameter verified successfully" -ForegroundColor Green
            Write-Host "Value length: $($verify.Length) characters" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to verify SSM parameter" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Failed to create SSM parameter" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error setting up SSM parameter: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Setup Summary:" -ForegroundColor Cyan
Write-Host "- SSM Parameter Path: $ssmPath" -ForegroundColor White
Write-Host "- Environment: $Environment" -ForegroundColor White
Write-Host "- Region: $Region" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Redeploy the collaboration service to pick up new environment variables" -ForegroundColor White
Write-Host "2. Test collaboration API endpoints" -ForegroundColor White


