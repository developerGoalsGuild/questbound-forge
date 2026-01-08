# Verify deployment - check if import.meta is in the deployed file

$bucket = "goalsguild-landing-page-dev-d4c20fbd"
$file = "js/main.js"

Write-Host "Checking local file..." -ForegroundColor Yellow
$localContent = Get-Content "..\src\js\main.js" -Raw
if ($localContent -match "import\.meta") {
    Write-Host "ERROR: Local file still contains import.meta!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✓ Local file is correct (no import.meta)" -ForegroundColor Green
}

Write-Host "`nChecking S3 file..." -ForegroundColor Yellow
try {
    $s3Content = aws s3 cp "s3://$bucket/$file" - 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Could not download from S3: $s3Content" -ForegroundColor Red
        exit 1
    }
    
    if ($s3Content -match "import\.meta") {
        Write-Host "ERROR: S3 file still contains import.meta!" -ForegroundColor Red
        Write-Host "The file needs to be re-uploaded." -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "✓ S3 file is correct (no import.meta)" -ForegroundColor Green
    }
    
    # Check if it has the correct code
    if ($s3Content -match "window\.GOALSGUILD_CONFIG") {
        Write-Host "✓ S3 file has correct API config code" -ForegroundColor Green
    } else {
        Write-Host "WARNING: S3 file might not have correct code" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
Write-Host "If both checks passed, the file is correct." -ForegroundColor Green
Write-Host "If you still see the error, clear your browser cache:" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+Shift+R (hard refresh)" -ForegroundColor Yellow
Write-Host "  - Or clear browser cache completely" -ForegroundColor Yellow















