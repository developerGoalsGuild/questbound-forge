param(
    [string]$GridUrl = $env:SELENIUM_GRID_URL,
    [string]$Browser = $env:TEST_BROWSER,
    [string]$AppUrl = $env:VITE_APP_URL,
    [string]$ApiKey = $env:VITE_API_GATEWAY_KEY
)

if (-not $ApiKey) {
    throw "VITE_API_GATEWAY_KEY must be provided (set env var or pass -ApiKey)."
}

if (-not $GridUrl) {
    Write-Host "ℹ️  SELENIUM_GRID_URL not provided – falling back to local WebDriver."
}

$env:SELENIUM_GRID_URL = $GridUrl
$env:TEST_BROWSER = $Browser
$env:VITE_APP_URL = $AppUrl
$env:VITE_API_GATEWAY_KEY = $ApiKey

Write-Host "🚀 Running Level & Badge Selenium scenario..."
node test/seleniumGridTests.js

if ($LASTEXITCODE -ne 0) {
    throw "Selenium scenario failed with exit code $LASTEXITCODE"
}

Write-Host "✅ Selenium scenario completed."

