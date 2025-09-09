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
    pytest -q --cov=app --cov-report=term-missing --cov-report=xml
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

