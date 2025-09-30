# Script to fix encoding issues in PowerShell deployment scripts
# This ensures all scripts are saved with UTF-8 BOM encoding

$ScriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ScriptFiles = Get-ChildItem -Path $ScriptsDir -Filter "deploy-*.ps1"

Write-Host "Fixing encoding for PowerShell deployment scripts..." -ForegroundColor Green

foreach ($ScriptFile in $ScriptFiles) {
    Write-Host "Processing: $($ScriptFile.Name)" -ForegroundColor Yellow
    
    # Read the content
    $Content = Get-Content -Path $ScriptFile.FullName -Raw -Encoding UTF8
    
    # Write back with UTF-8 BOM encoding
    $Content | Out-File -FilePath $ScriptFile.FullName -Encoding UTF8 -NoNewline
    
    Write-Host "Fixed encoding for: $($ScriptFile.Name)" -ForegroundColor Green
}

Write-Host "All deployment scripts have been fixed with proper UTF-8 BOM encoding." -ForegroundColor Green
Write-Host "You can now run the deployment scripts without encoding issues." -ForegroundColor Cyan
