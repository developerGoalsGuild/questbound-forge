param(
  [switch]$RunPython = $true,
  [switch]$RunInfra = $true,
  [switch]$RunFrontend = $true
)

$ErrorActionPreference = 'Stop'

function Resolve-RepoRoot {
  param(
    [string]$Hint
  )
  $candidates = @()
  if ($Hint) { $candidates += $Hint }
  if ($PSScriptRoot) { $candidates += $PSScriptRoot }
  $candidates += (Get-Location).Path

  foreach ($base in $candidates) {
    try {
      $dir = Resolve-Path $base -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Path
      if (-not $dir) { continue }
      for ($i=0; $i -lt 8; $i++) {
        $svcProbe   = Join-Path $dir 'backend/services/user-service'
        $feProbe    = Join-Path $dir 'frontend/package.json'
        if ((Test-Path $svcProbe) -and (Test-Path $feProbe)) { return $dir }
        $parent = Split-Path $dir -Parent
        if (-not $parent -or $parent -eq $dir) { break }
        $dir = $parent
      }
    } catch {}
  }
  # Fallback: current working directory
  return (Get-Location).Path
}

function Test-PythonAvailable {
  try { Get-Command python -ErrorAction Stop | Out-Null; return $true } catch {}
  try { Get-Command py -ErrorAction Stop | Out-Null; return $true } catch {}
  return $false
}

function Get-VenvPython($projDir) {
  $venvPy = Join-Path $projDir '.venv/Scripts/python.exe'
  if (Test-Path $venvPy) { return $venvPy }
  return $null
}

function Get-SystemPython {
  # Prefer Windows launcher `py.exe` when available
  try {
    $pyLauncher = (Get-Command py -ErrorAction Stop).Source
    if ($pyLauncher -and (Test-Path $pyLauncher)) { return $pyLauncher }
  } catch {}
  try {
    $pyCmd = (Get-Command python -ErrorAction Stop).Source
    # Guard against msys/git pseudo paths like /usr/bin/python
    if ($pyCmd -and (Test-Path $pyCmd) -and ($pyCmd -match '^[A-Za-z]:\\')) { return $pyCmd }
  } catch {}
  return $null
}

function Ensure-Venv($projDir) {
  $venvPy = Get-VenvPython $projDir
  if ($venvPy) { return $venvPy }
  $sysPy = Get-SystemPython
  if (-not $sysPy) { return $null }
  Push-Location $projDir
  try {
    if ($sysPy.ToLower().EndsWith('py.exe')) {
      # Prefer Python 3 if multiple installed; fall back to default
      & $sysPy -3 -m venv .venv | Out-Null
      if (-not (Test-Path '.venv/Scripts/python.exe')) { & $sysPy -m venv .venv | Out-Null }
    } else {
      & $sysPy -m venv .venv | Out-Null
    }
  } finally { Pop-Location }
  return (Get-VenvPython $projDir)
}

Write-Host "[test-all] Starting unified test run with coverage" -ForegroundColor Cyan

if ($RunPython) {
  if (-not (Test-PythonAvailable)) {
    Write-Host "[test-all] Python not found. Skipping Python test suites." -ForegroundColor Yellow
  } else {
  $root = Resolve-RepoRoot
  $svc = Join-Path $root 'backend/services/user-service'
  if (Test-Path $svc) {
    $svcPy = Ensure-Venv $svc
    if (-not $svcPy) {
      Write-Host "[test-all] No Python available for user-service (no system Python, no venv). Skipping." -ForegroundColor Yellow
    } else {
      Push-Location $svc
      try {
        & $svcPy -m pip install --upgrade pip | Out-Null
        & $svcPy -m pip install -r requirements.txt | Out-Null
        Write-Host "[test-all] Python tests (user-service)..." -ForegroundColor DarkCyan
        & $svcPy -m pytest -q --ignore tests/test_repository.py --ignore tests/test_service.py
      } finally { Pop-Location }
    }
  } else {
    Write-Host "[test-all] Could not find user-service under $root. Skipping." -ForegroundColor Yellow
  }

  # quest-service (FastAPI) tests
  $quest = Join-Path $root 'backend/services/quest-service'
  if (Test-Path $quest) {
    $questPy = Ensure-Venv $quest
    if (-not $questPy) {
      Write-Host "[test-all] No Python available for quest-service (no system Python, no venv). Skipping." -ForegroundColor Yellow
    } else {
      Push-Location $quest
      try {
        & $questPy -m pip install --upgrade pip | Out-Null
        & $questPy -m pip install -r requirements.txt | Out-Null
        & $questPy -m pip install pytest | Out-Null
        Write-Host "[test-all] Python tests (quest-service)..." -ForegroundColor DarkCyan
        & $questPy -m pytest -q
      } finally { Pop-Location }
    }
  } else {
    Write-Host "[test-all] Could not find quest-service under $root. Skipping." -ForegroundColor Yellow
  }
  }
}

if ($RunInfra) {
  $root = if ($root) { $root } else { Resolve-RepoRoot }
  $infra = Join-Path $root 'backend/infra/terraform'
  if (Test-Path $infra) {
    Push-Location $infra
    try {
      if (-not (Test-Path 'node_modules')) { npm install | Out-Null }
      Write-Host "[test-all] Infra tests (Jest) with coverage..." -ForegroundColor DarkCyan
      npm run test:cov -- --ci
    } finally { Pop-Location }
  } else {
    Write-Host "[test-all] Could not find infra under $root. Skipping infra tests." -ForegroundColor Yellow
  }
}

if ($RunFrontend) {
  $root = if ($root) { $root } else { Resolve-RepoRoot }
  $fe = Join-Path $root 'frontend'
  if (Test-Path $fe) {
    Push-Location $fe
    try {
      if (-not (Test-Path 'node_modules')) { npm install | Out-Null }
      Write-Host "[test-all] Frontend tests (Vitest) with coverage..." -ForegroundColor DarkCyan
      npx vitest run --coverage
    } finally { Pop-Location }
  } else {
    Write-Host "[test-all] Could not find frontend under $root. Skipping frontend tests." -ForegroundColor Yellow
  }
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
    'backend/services/user-service/.pytest_cache',
    'backend/services/quest-service/.pytest_cache'
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
