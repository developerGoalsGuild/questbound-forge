param(
  [ValidateSet('dev','staging','prod')]
  [string]$Env = 'dev',
  [switch]$AutoApprove,
  [switch]$SkipInit,
  [switch]$RunUserTests,
  [string]$TfLogPath = 'D:\terraformLogs\tf.log'
)

$ErrorActionPreference = 'Stop'

# Paths
$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$TerraformDir = Join-Path $ScriptDir '..' | Resolve-Path | Select-Object -ExpandProperty Path
$FrontendDir  = Join-Path $ScriptDir '../../../../frontend' | Resolve-Path | Select-Object -ExpandProperty Path
$TfvarsFile   = Join-Path $TerraformDir "environments/$Env.tfvars"

if (-not (Test-Path $TfvarsFile)) { Write-Error "tfvars file not found: $TfvarsFile" }

# Enable Terraform DEBUG logs to file
try {
  $logDir = Split-Path -Parent $TfLogPath
  if ($logDir -and -not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
  if (Test-Path $TfLogPath) { Clear-Content $TfLogPath -ErrorAction SilentlyContinue } else { New-Item -ItemType File -Path $TfLogPath | Out-Null }
  $env:TF_LOG = 'DEBUG'
  $env:TF_LOG_PATH = $TfLogPath
  Write-Host "[deploy] TF_LOG=DEBUG, TF_LOG_PATH=$TfLogPath" -ForegroundColor DarkGray
} catch {}

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
    pytest -q --ignore tests/test_repository.py --ignore tests/test_service.py
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

# Post-apply validate AppSync resolver with evaluate-code (best-effort)
$CreateUserPath     = Join-Path $TerraformDir 'resolvers/createUser.js'
$CreateUserReqCtx   = Join-Path $TerraformDir 'resolvers/context/createUser.request.json'
$CreateUserRespCtx  = Join-Path $TerraformDir 'resolvers/context/createUser.response.json'

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
  & terraform @applyArgs | Write-Output
  $tfExit = $LASTEXITCODE
  if ($tfExit -ne 0) {
    Write-Warning "[deploy] Terraform apply failed with exit code $tfExit. See log at $TfLogPath for details."
    throw "Terraform apply failed."
  }
}
finally {
  Pop-Location
}

# After apply, try best-effort AppSync code evaluation if AWS CLI is available
try {
  Write-Host "[deploy] Attempting AppSync evaluate-code validation (post-apply)..." -ForegroundColor Cyan
  $AwsCli = Get-Command aws -ErrorAction SilentlyContinue
  if (-not $AwsCli) { throw "AWS CLI not found; skipping evaluate-code." }
  $AwsPath = $AwsCli.Source
  # OS detection
  $IsWin = $true
  try {
    if ($null -ne $IsWindows) { $IsWin = [bool]$IsWindows }
    else { $IsWin = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows) }
  } catch { $IsWin = $env:OS -eq 'Windows_NT' }

  function Test-EvaluateCodeSupport {
    try { & aws appsync evaluate-code help | Out-Null; return ($LASTEXITCODE -eq 0) } catch { return $false }
  }
  if (-not (Test-EvaluateCodeSupport)) { throw "'aws appsync evaluate-code' not available; skipping." }

  Push-Location $TerraformDir
  try { $ApiId = (terraform output -raw appsync_api_id) 2>$null } catch { $ApiId = $null } finally { Pop-Location }
  if (-not $ApiId) { throw "AppSync API ID not found in outputs; skipping evaluate-code." }

  if (-not (Test-Path $CreateUserPath))   { throw "Resolver not found: $CreateUserPath" }
  if (-not (Test-Path $CreateUserReqCtx)) { throw "Request context not found: $CreateUserReqCtx" }
  if (-not (Test-Path $CreateUserRespCtx)) { Write-Warning "[deploy] Response context not found: $CreateUserRespCtx (skipping response eval)" }

  function Invoke-EvaluateCode {
    param([string]$CodePath,[string]$ContextPath,[ValidateSet('request','response')][string]$Function)
    $origEAP = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    if ($IsWin) {
      $cmdLine = '"' + $AwsPath + '" appsync evaluate-code --runtime name=APPSYNC_JS,runtimeVersion=1.0.0 --code ' + 'file://"' + $CodePath + '"' + ' --context ' + 'file://"' + $ContextPath + '"' + ' --function ' + $Function
      $out = & cmd.exe /c $cmdLine 2>&1
    } else {
      $args = @('appsync','evaluate-code','--runtime','name=APPSYNC_JS,runtimeVersion=1.0.0','--code',"file://$CodePath",'--context',"file://$ContextPath",'--function',$Function)
      $out = & $AwsPath @args 2>&1
    }
    $ErrorActionPreference = $origEAP
    $raw = ($out | Out-String)
    try { return $raw | ConvertFrom-Json } catch { return $null }
  }

  $evalReq = Invoke-EvaluateCode -CodePath $CreateUserPath -ContextPath $CreateUserReqCtx -Function 'request'
  if ($evalReq -and -not $evalReq.errors) { Write-Host "[deploy] createUser request evaluation passed." -ForegroundColor Green }
  elseif ($evalReq -and $evalReq.errors) { Write-Warning "[deploy] createUser request evaluation produced errors (see below)."; $evalReq | ConvertTo-Json -Depth 6 }

  if (Test-Path $CreateUserRespCtx) {
    $evalRes = Invoke-EvaluateCode -CodePath $CreateUserPath -ContextPath $CreateUserRespCtx -Function 'response'
    if ($evalRes -and -not $evalRes.errors) { Write-Host "[deploy] createUser response evaluation passed." -ForegroundColor Green }
    elseif ($evalRes -and $evalRes.errors) { Write-Warning "[deploy] createUser response evaluation produced errors (see below)."; $evalRes | ConvertTo-Json -Depth 6 }
  }
} catch {
  Write-Warning "[deploy] Skipping evaluate-code step: $($_.Exception.Message)"
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
  $syncApigw = Join-Path $ScriptDir 'sync_apigw_key_to_env.js'
  if (Test-Path $syncApigw) {
    Write-Host "[deploy] Syncing API Gateway key to .env.$mode" -ForegroundColor Cyan
    node $syncApigw --mode=$mode | Write-Output
  }
}
finally {
  Pop-Location
}

Write-Host "[deploy] Done. Restart frontend dev server to pick up env changes." -ForegroundColor Green
