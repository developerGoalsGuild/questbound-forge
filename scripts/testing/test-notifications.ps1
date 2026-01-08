# Quest Notifications Test Script
# This script runs comprehensive tests for the quest notification system

Write-Host "🧪 Quest Notifications Test Suite" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "apps/frontend/package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Navigate to frontend directory
Set-Location apps/frontend

Write-Host "📁 Changed to frontend directory" -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Run notification tests
Write-Host "🚀 Running notification tests..." -ForegroundColor Yellow
Write-Host ""

# Run unit tests for notifications
Write-Host "1️⃣ Running unit tests..." -ForegroundColor Cyan
npm test -- --testPathPattern="notifications" --coverage --passWithNoTests

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Unit tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Unit tests failed!" -ForegroundColor Red
}

Write-Host ""

# Run integration tests if they exist
Write-Host "2️⃣ Running integration tests..." -ForegroundColor Cyan
npm test -- --testPathPattern="integration.*notification" --passWithNoTests

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Integration tests passed!" -ForegroundColor Green
} else {
    Write-Host "⚠️  No integration tests found or they failed" -ForegroundColor Yellow
}

Write-Host ""

# Run all quest-related tests
Write-Host "3️⃣ Running all quest-related tests..." -ForegroundColor Cyan
npm test -- --testPathPattern="quest" --coverage --passWithNoTests

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Quest tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Quest tests failed!" -ForegroundColor Red
}

Write-Host ""

# Check for linting errors
Write-Host "4️⃣ Checking for linting errors..." -ForegroundColor Cyan
npm run lint -- --no-fix --max-warnings 0

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ No linting errors found!" -ForegroundColor Green
} else {
    Write-Host "❌ Linting errors found!" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host "• Unit tests: $(if ($LASTEXITCODE -eq 0) { '✅ Passed' } else { '❌ Failed' })" -ForegroundColor $(if ($LASTEXITCODE -eq 0) { 'Green' } else { 'Red' })
Write-Host "• Integration tests: $(if ($LASTEXITCODE -eq 0) { '✅ Passed' } else { '⚠️  Skipped' })" -ForegroundColor $(if ($LASTEXITCODE -eq 0) { 'Green' } else { 'Yellow' })
Write-Host "• Quest tests: $(if ($LASTEXITCODE -eq 0) { '✅ Passed' } else { '❌ Failed' })" -ForegroundColor $(if ($LASTEXITCODE -eq 0) { 'Green' } else { 'Red' })
Write-Host "• Linting: $(if ($LASTEXITCODE -eq 0) { '✅ Passed' } else { '❌ Failed' })" -ForegroundColor $(if ($LASTEXITCODE -eq 0) { 'Green' } else { 'Red' })

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run the app in development mode: npm run dev" -ForegroundColor White
Write-Host "2. Add NotificationTester component to test manually" -ForegroundColor White
Write-Host "3. Check the testing guide: docs/testing/notification-testing-guide.md" -ForegroundColor White
Write-Host "4. Test with different user preferences" -ForegroundColor White

Write-Host ""
Write-Host "✨ Notification testing complete!" -ForegroundColor Green
