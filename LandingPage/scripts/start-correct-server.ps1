# GoalsGuild Landing Page - Correct Server Start
# This script ensures we're in the correct directory and serving the right files

Write-Host "🎯 GoalsGuild Landing Page - Starting Correct Server" -ForegroundColor Blue
Write-Host "=================================================" -ForegroundColor Blue

# Kill any existing Python servers
Write-Host "🛑 Stopping any existing Python servers..." -ForegroundColor Yellow
try {
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Stopped existing Python processes" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No existing Python processes found" -ForegroundColor Blue
}

# Get the script directory and navigate to the correct location
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

# Change to the landing page directory
Write-Host "`n📁 Changing to directory: $LandingPageDir" -ForegroundColor Blue
Set-Location $LandingPageDir

# Verify we're in the right place
$CurrentDir = Get-Location
Write-Host "📍 Current directory: $CurrentDir" -ForegroundColor Blue

# Verify the files are there
Write-Host "`n🔍 Verifying files:" -ForegroundColor Blue
if (Test-Path "index.html") {
    $Size = (Get-Item "index.html").Length
    Write-Host "✅ index.html found ($Size bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ index.html not found" -ForegroundColor Red
    exit 1
}

if (Test-Path "blog.html") {
    $Size = (Get-Item "blog.html").Length
    Write-Host "✅ blog.html found ($Size bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ blog.html not found" -ForegroundColor Red
}

if (Test-Path "css") {
    Write-Host "✅ css directory found" -ForegroundColor Green
} else {
    Write-Host "❌ css directory not found" -ForegroundColor Red
}

if (Test-Path "js") {
    Write-Host "✅ js directory found" -ForegroundColor Green
} else {
    Write-Host "❌ js directory not found" -ForegroundColor Red
}

# Start the server
Write-Host "`n🚀 Starting HTTP server on port 9000..." -ForegroundColor Yellow
Write-Host "🌐 Open your browser and go to: http://localhost:9000" -ForegroundColor Green
Write-Host "📝 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server (this will block until stopped)
python -m http.server 9000
