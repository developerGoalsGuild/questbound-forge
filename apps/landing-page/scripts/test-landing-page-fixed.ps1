# GoalsGuild Landing Page - Fixed Test Script
# This script ensures we're in the correct directory and serving the right files

Write-Host "🎯 GoalsGuild Landing Page - Fixed Test Script" -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.PSCommandPath
$LandingPageDir = Join-Path $ScriptDir "..\src"

Write-Host "📁 Script directory: $ScriptDir" -ForegroundColor Yellow
Write-Host "📁 Landing page directory: $LandingPageDir" -ForegroundColor Yellow

# Check if the directory exists
if (-not (Test-Path $LandingPageDir)) {
    Write-Host "❌ LandingPage/src directory not found at: $LandingPageDir" -ForegroundColor Red
    exit 1
}

# Check if index.html exists and get its size
$IndexFile = Join-Path $LandingPageDir "index.html"
if (Test-Path $IndexFile) {
    $FileSize = (Get-Item $IndexFile).Length
    Write-Host "✅ Found index.html (Size: $FileSize bytes)" -ForegroundColor Green
    
    if ($FileSize -lt 1000) {
        Write-Host "⚠️  Warning: index.html seems too small. Expected ~17KB for landing page." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ index.html not found in $LandingPageDir" -ForegroundColor Red
    exit 1
}

# List all files in the directory
Write-Host "`n📋 Files in landing page directory:" -ForegroundColor Blue
Get-ChildItem $LandingPageDir | ForEach-Object {
    Write-Host "  $($_.Name) ($($_.Length) bytes)" -ForegroundColor Green
}

# Kill any existing Python servers
Write-Host "`n🛑 Stopping any existing Python servers..." -ForegroundColor Yellow
try {
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Stopped existing Python processes" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No existing Python processes found" -ForegroundColor Blue
}

# Change to the landing page directory
Write-Host "`n📁 Changing to directory: $LandingPageDir" -ForegroundColor Blue
Set-Location $LandingPageDir

# Verify we're in the right place
$CurrentDir = Get-Location
Write-Host "📍 Current directory: $CurrentDir" -ForegroundColor Blue

# Start the server
Write-Host "`n🚀 Starting HTTP server on port 9000..." -ForegroundColor Yellow
Write-Host "🌐 Open your browser and go to: http://localhost:9000" -ForegroundColor Green
Write-Host "📝 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server (this will block until stopped)
python -m http.server 9000
