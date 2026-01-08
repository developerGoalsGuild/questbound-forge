# GoalsGuild Landing Page - Local Test Server
# Simple script to start a local server for testing

Write-Host "🎯 GoalsGuild Landing Page - Local Test Server" -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue

# Check if Python is available
try {
    python --version | Out-Null
    Write-Host "✅ Python is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python from https://python.org" -ForegroundColor Yellow
    exit 1
}

# Navigate to the source directory
$SourceDir = Join-Path $PSScriptRoot "..\src"

if (-not (Test-Path $SourceDir)) {
    Write-Host "❌ LandingPage/src directory not found at: $SourceDir" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Serving files from: $SourceDir" -ForegroundColor Blue

# Change to source directory
Set-Location $SourceDir

# Start the server
Write-Host "🚀 Starting HTTP server on port 9000..." -ForegroundColor Yellow
Write-Host "🌐 Open your browser and go to: http://localhost:9000" -ForegroundColor Green
Write-Host "📝 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server (this will block until stopped)
python -m http.server 9000
