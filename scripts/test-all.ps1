param(
  [switch]$RunPython = $true,
  [switch]$RunInfra = $true,
  [switch]$RunFrontend = $true
)

$ErrorActionPreference = 'Stop'

Write-Host "[test-all] Starting unified test run with coverage" -ForegroundColor Cyan

if ($RunPython) {
  $svc = Join-Path $PSScriptRoot '../backend/services/user-service' | Resolve-Path | Select-Object -ExpandProperty Path
  Push-Location $svc
  try {
    if (-not (Test-Path '.venv')) { python -m venv .venv }
    . ./.venv/Scripts/Activate.ps1
    python -m pip install --upgrade pip | Out-Null
    pip install -r requirements.txt | Out-Null
    Write-Host "[test-all] Python tests (user-service)..." -ForegroundColor DarkCyan
    pytest -q --ignore tests/test_repository.py --ignore tests/test_service.py
  } finally { Pop-Location }
}

if ($RunInfra) {
  $infra = Join-Path $PSScriptRoot '../backend/infra/terraform' | Resolve-Path | Select-Object -ExpandProperty Path
  Push-Location $infra
  try {
    if (-not (Test-Path 'node_modules')) { npm install | Out-Null }
    Write-Host "[test-all] Infra tests (Jest) with coverage..." -ForegroundColor DarkCyan
    npm run test:cov -- --ci
  } finally { Pop-Location }
}

if ($RunFrontend) {
  $fe = Join-Path $PSScriptRoot '../frontend' | Resolve-Path | Select-Object -ExpandProperty Path
  Push-Location $fe
  try {
    if (-not (Test-Path 'node_modules')) { npm install | Out-Null }
    Write-Host "[test-all] Frontend tests (Vitest) with coverage..." -ForegroundColor DarkCyan
    npx vitest run --coverage
  } finally { Pop-Location }
}

Write-Host "[test-all] Done." -ForegroundColor Green

# Cleanup coverage artifacts to keep the repo tidy
try {
  Write-Host "[test-all] Cleaning coverage artifacts..." -ForegroundColor DarkGray
  $Root = Resolve-Path (Join-Path $PSScriptRoot '..') | Select-Object -ExpandProperty Path
  $targets = @(
    'frontend/coverage',
    'frontend/.nyc_output',
    'backend/infra/terraform/coverage',
    'backend/infra/terraform/.nyc_output',
    'backend/services/user-service/htmlcov',
    'backend/services/user-service/.pytest_cache'
  )
  foreach ($rel in $targets) {
    $p = Join-Path $Root $rel
    if (Test-Path $p) { Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $p }
  }
  # Files
  $files = @(
    'backend/services/user-service/coverage.xml',
    'backend/services/user-service/.coverage',
    'backend/services/user-service/.coverage.*',
    'backend/infra/terraform/lcov.info',
    'frontend/lcov.info'
  )
  foreach ($pattern in $files) {
    Get-ChildItem -Path (Join-Path $Root $pattern) -ErrorAction SilentlyContinue | ForEach-Object { Remove-Item -Force -ErrorAction SilentlyContinue $_.FullName }
  }
} catch {}
