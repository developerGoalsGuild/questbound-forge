param(
  [ValidateSet('dev','staging','prod')]
  [string]$Env = 'dev',
  [switch]$AutoApprove,
  [switch]$SkipInit,
  [switch]$RunUserTests
)

$ErrorActionPreference = 'Stop'

# Paths
$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$TerraformDir = Join-Path $ScriptDir '..' | Resolve-Path | Select-Object -ExpandProperty Path
$FrontendDir  = Join-Path $ScriptDir '../../../../frontend' | Resolve-Path | Select-Object -ExpandProperty Path
$TfvarsFile   = Join-Path $TerraformDir "environments/$Env.tfvars"

if (-not (Test-Path $TfvarsFile)) {
  Write-Error "tfvars file not found: $TfvarsFile"
}

# Run Python user-service tests first (optional)
if ($RunUserTests) {
  $UserSvcDir = Join-Path $ScriptDir '../../../../backend/services/user-service' | Resolve-Path | Select-Object -ExpandProperty Path
  if (-not (Test-Path $UserSvcDir)) { Write-Error "[deploy] user-service directory not found: $UserSvcDir" }
  $python = Get-Command python -ErrorAction SilentlyContinue
  if (-not $python) { Write-Error "[deploy] Python not found on PATH; cannot run user-service tests. Install Python 3.10+ or omit -RunUserTests." }
  Push-Location $UserSvcDir
  try {
    Write-Host "[deploy] Setting up virtual environment for user-service tests..." -ForegroundColor DarkCyan
    $venv = Join-Path $UserSvcDir '.venv'
    if (-not (Test-Path $venv)) { python -m venv .venv }
    $activate = Join-Path $venv 'Scripts/Activate.ps1'
    if (-not (Test-Path $activate)) { Write-Error "[deploy] Could not find venv activation script at $activate" }
    . $activate
    python -m pip install --upgrade pip | Write-Output
    pip install -r requirements.txt | Write-Output
    Write-Host "[deploy] Running user-service tests..." -ForegroundColor Cyan
    pytest -q
  } finally {
    Pop-Location
  }
  if ($LASTEXITCODE -ne 0) { Write-Error "[deploy] user-service tests failed. Aborting." }
}

# Lint resolvers to catch AppSync runtime limitations early
Push-Location $TerraformDir
try {
  if (-not (Test-Path (Join-Path $TerraformDir 'node_modules'))) {
    Write-Host "[deploy] Installing dev dependencies (lint)..." -ForegroundColor DarkCyan
    npm install
  }
  Write-Host "[deploy] Linting resolvers..." -ForegroundColor Cyan
  npm run lint
} finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { Write-Error "[deploy] Lint failed. Aborting." }

# Run unit tests for resolvers before deploying
$TestScript = Join-Path $ScriptDir 'test.ps1'
Write-Host "[deploy] Running backend resolver tests..." -ForegroundColor Cyan
if (Test-Path $TestScript) {
  & $TestScript
} else {
  Push-Location $TerraformDir
  try {
    if (-not (Test-Path (Join-Path $TerraformDir 'node_modules'))) {
      Write-Host "[deploy] Installing dev dependencies for tests..." -ForegroundColor DarkCyan
      npm install
    }
    npm test
  } finally {
    Pop-Location
  }
}
if ($LASTEXITCODE -ne 0) {
  Write-Error "[deploy] Unit tests failed. Aborting Terraform deployment."
}

# Evaluate createUser resolver code in AppSync before apply
Write-Host "[deploy] Validating createUser resolver via aws appsync evaluate-code..." -ForegroundColor Cyan
$AwsCli = Get-Command aws -ErrorAction SilentlyContinue
if (-not $AwsCli) { Write-Error "[deploy] AWS CLI not found in PATH. Install AWS CLI v2 to use evaluate-code validation." }
$AwsPath = $AwsCli.Source
# Robust Windows detection (older PS may not have $IsWindows)
$IsWin = $true
try {
  if ($null -ne $IsWindows) { $IsWin = [bool]$IsWindows }
  else {
    $IsWin = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows)
  }
} catch { $IsWin = $env:OS -eq 'Windows_NT' }

# Ensure evaluate-code is supported by installed CLI
function Test-EvaluateCodeSupport {
  try {
    & aws appsync evaluate-code help | Out-Null
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  }
}
if (-not (Test-EvaluateCodeSupport)) {
  Write-Warning "[deploy] 'aws appsync evaluate-code' command not available in your AWS CLI. Skipping code evaluation."
  $SkipEvaluate = $true
} else { $SkipEvaluate = $false }

# Try to read current AppSync API ID from terraform outputs (existing state)
Push-Location $TerraformDir
try { $ApiId = (terraform output -raw appsync_api_id) 2>$null } catch { $ApiId = $null } finally { Pop-Location }
if (-not $ApiId) { Write-Error "[deploy] Could not determine AppSync API ID from terraform outputs. Deploy once to create the API and outputs." }

$CreateUserPath     = Join-Path $TerraformDir 'resolvers/createUser.js'
$CreateUserReqCtx   = Join-Path $TerraformDir 'resolvers/context/createUser.request.json'
$CreateUserRespCtx  = Join-Path $TerraformDir 'resolvers/context/createUser.response.json'
if (-not (Test-Path $CreateUserPath))   { Write-Error "[deploy] Resolver not found: $CreateUserPath" }
if (-not (Test-Path $CreateUserReqCtx)) { Write-Error "[deploy] Request context not found: $CreateUserReqCtx" }
if (-not (Test-Path $CreateUserRespCtx)) { Write-Warning "[deploy] Response context not found: $CreateUserRespCtx (skipping response eval)" }

if (-not $SkipEvaluate) {
  # Helper to run evaluate-code and parse JSON with exit code check
  function Invoke-EvaluateCode {
    param(
      [string]$ApiId,
      [string]$CodePath,
      [string]$ContextPath,
      [ValidateSet('request','response')][string]$Function
    )
    $origEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    if ($IsWin) {
      # Invoke via cmd.exe to avoid PS argument parsing issues (include --api-id). Use file:// (text) for code/context.
      $cmdLine = '"' + $AwsPath + '" appsync evaluate-code --runtime name=APPSYNC_JS,runtimeVersion=1.0.0 --code ' + 'file://"' + $CodePath + '"' + ' --context ' + 'file://"' + $ContextPath + '"' + ' --function ' + $Function
      $out = & cmd.exe /c $cmdLine 2>&1
    } else {
      $arguments = @('appsync','evaluate-code',        
        '--runtime', 'name=APPSYNC_JS,runtimeVersion=1.0.0',
        '--code', "file://$CodePath",
        '--context', "file://$ContextPath",
        '--function', $Function)
      $out = & $AwsPath @arguments 2>&1
    }
    $ErrorActionPreference = $origEAP
    $exit = $LASTEXITCODE
    $raw = ($out | Out-String)
    if ($exit -ne 0) {
      Write-Host $raw
      Write-Error "[deploy] aws appsync evaluate-code ($Function) exited with code $exit. Aborting."
    }
    try { return $raw | ConvertFrom-Json } catch { return $null }
  }

  # Evaluate request
  $evalReq = Invoke-EvaluateCode -ApiId $ApiId -CodePath $CreateUserPath -ContextPath $CreateUserReqCtx -Function 'request'
  if ($null -eq $evalReq) { Write-Error "[deploy] Failed to parse evaluate-code JSON for request. Aborting." }
  if ($evalReq.errors -and $evalReq.errors.Count -gt 0) {
    Write-Host ($evalReq | ConvertTo-Json -Depth 6)
    Write-Error "[deploy] appsync evaluate-code reported errors for createUser request. Aborting."
  } else { Write-Host "[deploy] createUser request evaluation passed." -ForegroundColor Green }

  # Evaluate response (optional if context exists)
  if (Test-Path $CreateUserRespCtx) {
    $evalRes = Invoke-EvaluateCode -ApiId $ApiId -CodePath $CreateUserPath -ContextPath $CreateUserRespCtx -Function 'response'
    if ($null -eq $evalRes) { Write-Error "[deploy] Failed to parse evaluate-code JSON for response. Aborting." }
    if ($evalRes.errors -and $evalRes.errors.Count -gt 0) {
      Write-Host ($evalRes | ConvertTo-Json -Depth 6)
      Write-Error "[deploy] appsync evaluate-code reported errors for createUser response. Aborting."
    } else { Write-Host "[deploy] createUser response evaluation passed." -ForegroundColor Green }
  }
}

# Terraform init/apply
Push-Location $TerraformDir
try {
  if (-not $SkipInit) {
    Write-Host "[deploy] Running terraform init..." -ForegroundColor Cyan
    terraform init | Write-Output
  }
  $applyArgs = @('apply','-var-file', $TfvarsFile)
  if ($AutoApprove) { $applyArgs += '-auto-approve' }
  Write-Host "[deploy] Running terraform $($applyArgs -join ' ')" -ForegroundColor Cyan
  terraform @applyArgs | Write-Output
}
finally {
  Pop-Location
}

# Sync API key to frontend env file
$modeMap = @{ dev = 'development'; staging = 'staging'; prod = 'production' }
$mode    = $modeMap[$Env]
$syncScript = Join-Path $ScriptDir 'sync_appsync_key_to_env.js'

if (-not (Test-Path $syncScript)) {
  Write-Error "Sync script not found: $syncScript"
}

Push-Location $FrontendDir
try {
  Write-Host "[deploy] Syncing API key to .env.$mode" -ForegroundColor Cyan
  node $syncScript --mode=$mode | Write-Output
  $syncCognito = Join-Path $ScriptDir 'sync_cognito_to_env.js'
  if (Test-Path $syncCognito) {
    Write-Host "[deploy] Syncing Cognito vars to .env.$mode" -ForegroundColor Cyan
    node $syncCognito --mode=$mode | Write-Output
  }
}
finally {
  Pop-Location
}

Write-Host "[deploy] Done. Restart frontend dev server to pick up env changes." -ForegroundColor Green
