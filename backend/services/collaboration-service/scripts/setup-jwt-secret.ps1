# Collaboration Service JWT Secret Setup Script
# This script sets up the JWT secret in AWS SSM for the collaboration service

param(
    [string]$Environment = "dev",
    [string]$Region = "us-east-2",
    [string]$JwtSecret = "test-secret-key-for-development-only",
    [switch]$DryRun
)

Write-Host "Setting up Collaboration Service JWT Secret for $Environment..." -ForegroundColor Green

$ssmPath = "/goalsguild/user-service/JWT_SECRET"

Write-Host "SSM Parameter Path: $ssmPath" -ForegroundColor Yellow
Write-Host "JWT Secret Length: $($JwtSecret.Length) characters" -ForegroundColor Yellow
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN - Would create/update SSM parameter:" -ForegroundColor Cyan
    Write-Host "Path: $ssmPath" -ForegroundColor Cyan
    Write-Host "Type: SecureString" -ForegroundColor Cyan
    Write-Host "Value: [HIDDEN]" -ForegroundColor Cyan
    return
}

try {
    # Create/update SSM parameter with JWT secret
    $result = aws ssm put-parameter `
        --name $ssmPath `
        --value $JwtSecret `
        --type "SecureString" `
        --description "JWT Secret for Collaboration Service ($Environment)" `
        --overwrite `
        --region $Region

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully created/updated JWT secret SSM parameter: $ssmPath" -ForegroundColor Green

        # Verify the parameter exists (but don't show the value)
        Write-Host "Verifying SSM parameter exists..." -ForegroundColor Yellow
        $verify = aws ssm get-parameter `
            --name $ssmPath `
            --region $Region `
            --with-decryption `
            --query "Parameter.Value" `
            --output text 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ JWT secret SSM parameter verified (length: $($verify.Length))" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to verify JWT secret SSM parameter" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Failed to create/update JWT secret SSM parameter" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error setting up JWT secret SSM parameter: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "JWT Secret Setup Summary:" -ForegroundColor Cyan
Write-Host "- SSM Parameter Path: $ssmPath" -ForegroundColor White
Write-Host "- Environment: $Environment" -ForegroundColor White
Write-Host "- Region: $Region" -ForegroundColor White
Write-Host ""
Write-Host "Note: This JWT secret is shared across all services (user-service, quest-service, collaboration-service)" -ForegroundColor Yellow


