param(
  [switch]$Watch
)

$ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot/..
try {
  if (-not (Test-Path node_modules)) {
    Write-Host "Installing dev dependencies for backend tests..."
    npm install
  }
  if ($Watch) {
    npm run test:watch
  } else {
    npm test
  }
} finally {
  Pop-Location
}

