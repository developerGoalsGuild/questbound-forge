param(
  [Parameter(Mandatory=$true)] [string]$Path,
  [ValidateSet('request','response')] [string]$Function = 'request',
  [string]$ContextFile,
  [string]$Region,
  [string]$Profile,
  [string]$RuntimeVersion = '1.0.0'
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Path)) { Write-Error "Resolver file not found: $Path" }
$full = Resolve-Path $Path | Select-Object -ExpandProperty Path

# Build context JSON
if ($ContextFile) {
  if (-not (Test-Path $ContextFile)) { Write-Error "Context file not found: $ContextFile" }
  $ctx = Get-Content -Path $ContextFile -Raw
} else {
  $defaultContext = @{ arguments = @{}; source = $null; stash = @{}; prevResult = $null }
  $ctx = ($defaultContext | ConvertTo-Json -Depth 6)
}

# AWS CLI args
$runtimeArg = "name=APPSYNC_JS,runtimeVersion=$RuntimeVersion"
$codeArg = "fileb://$full"
$common = @('appsync','evaluate-code','--runtime', $runtimeArg, '--code', $codeArg, '--function', $Function, '--context', $ctx)
if ($Region)  { $common += @('--region', $Region) }
if ($Profile) { $common += @('--profile', $Profile) }

Write-Host "[check-resolver] aws $($common -join ' ')" -ForegroundColor Cyan
$proc = Start-Process -FilePath aws -ArgumentList $common -NoNewWindow -PassThru -Wait -RedirectStandardOutput "${env:TEMP}\_eval_out.json" -RedirectStandardError "${env:TEMP}\_eval_err.txt"

if ($LASTEXITCODE -ne 0) {
  Write-Host "[check-resolver] AWS CLI exited with code $LASTEXITCODE" -ForegroundColor Red
  if (Test-Path "${env:TEMP}\_eval_err.txt") { Get-Content "${env:TEMP}\_eval_err.txt" | Write-Output }
  exit $LASTEXITCODE
}

if (Test-Path "${env:TEMP}\_eval_out.json") {
  $out = Get-Content "${env:TEMP}\_eval_out.json" -Raw | ConvertFrom-Json
  # Print errors if any
  if ($out?.errors -and $out.errors.Count -gt 0) {
    Write-Host "[check-resolver] Errors:" -ForegroundColor Yellow
    $out.errors | ForEach-Object { $_ | ConvertTo-Json -Depth 6 | Write-Output }
    exit 2
  }
  Write-Host "[check-resolver] OK" -ForegroundColor Green
  $out | ConvertTo-Json -Depth 8 | Write-Output
}