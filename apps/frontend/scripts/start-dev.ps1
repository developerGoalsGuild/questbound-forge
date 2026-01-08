param(
  [switch]$SkipSync
)

$ErrorActionPreference = 'Stop'

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Resolve-Path (Join-Path $ScriptDir '../..') | Select-Object -ExpandProperty Path
$Frontend  = Join-Path $RepoRoot 'frontend'
$SyncNode  = Join-Path $RepoRoot 'backend/infra/terraform/scripts/sync_appsync_key_to_env.js'

# Ensure npm is available
try { npm -v | Out-Null } catch { Write-Error 'npm is not available in PATH.' }

# Optionally sync API key to .env.development
if (-not $SkipSync) {
  if (Test-Path $SyncNode) {
    Write-Host '[frontend] Syncing API key to .env.development' -ForegroundColor Cyan
    Push-Location $Frontend
    try {
      node $SyncNode --mode=development | Write-Output
    } finally {
      Pop-Location
    }
  } else {
    Write-Warning "Sync script not found: $SyncNode"
  }
}

# Install deps if node_modules missing
$nodeModules = Join-Path $Frontend 'node_modules'
if (-not (Test-Path $nodeModules)) {
  Write-Host '[frontend] Installing dependencies (npm ci fallback to npm i)' -ForegroundColor Cyan
  Push-Location $Frontend
  try {
    if (Test-Path (Join-Path $Frontend 'package-lock.json')) { npm ci } else { npm install }
  } finally { Pop-Location }
}

# Start Vite dev server
Write-Host '[frontend] Starting Vite dev server...' -ForegroundColor Green
Push-Location $Frontend
try {
  npm run dev
} finally {
  Pop-Location
}