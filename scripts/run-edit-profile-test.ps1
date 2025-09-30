Param(
  [string]$GridUrl = $env:SELENIUM_GRID_URL,
  [string]$BaseUrl = $env:BASE_URL,
  [string]$Email = $(if ($env:GOALSGUILD_USER) { $env:GOALSGUILD_USER } else { $env:TEST_USER_EMAIL }),
  [string]$Password = $(if ($env:GOALSGUILD_PASSWORD) { $env:GOALSGUILD_PASSWORD } else { $env:TEST_USER_PASSWORD })
)

if (-not $GridUrl) { $GridUrl = 'http://localhost:4444/wd/hub' }
if (-not $BaseUrl) { $BaseUrl = 'http://localhost:8080' }

if (-not $Email -or -not $Password) {
  Write-Error "Missing TEST_USER_EMAIL or TEST_USER_PASSWORD in environment."
  exit 1
}

Write-Host "Running Edit Profile E2E with:" -ForegroundColor Cyan
Write-Host "  SELENIUM_GRID_URL=$GridUrl"
Write-Host "  BASE_URL=$BaseUrl"
Write-Host "  TEST_USER_EMAIL=$Email"

Push-Location "$PSScriptRoot\..\tests\integration"
try {
  $env:SELENIUM_GRID_URL = $GridUrl
  $env:BASE_URL = $BaseUrl
  $env:GOALSGUILD_USER = $Email
  $env:GOALSGUILD_PASSWORD = $Password
  node .\editProfileTest.js
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

Write-Host "Edit Profile E2E completed" -ForegroundColor Green


