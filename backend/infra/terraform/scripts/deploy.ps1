param(
  [ValidateSet('dev','staging','prod')]
  [string]$Env = 'dev',
  [switch]$AutoApprove,
  [switch]$SkipInit
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

# Ensure evaluate-code is supported by installed CLI
$appsyncHelp = (& aws appsync help 2>$null)
if (-not $appsyncHelp -or ($appsyncHelp -notmatch 'evaluate-code')) {
  Write-Error "[deploy] Your AWS CLI does not support 'aws appsync evaluate-code'. Please update to AWS CLI v2 (2.13.7+) and retry."
}

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

# Helper to run evaluate-code and parse JSON
function Invoke-EvaluateCode {
  param(
    [string]$ApiId,
    [string]$CodePath,
    [string]$ContextPath,
    [ValidateSet('request','response')][string]$Function
  )
  $args = @('appsync','evaluate-code',
            '--api-id', $ApiId,
            '--runtime', 'name=APPSYNC_JS,runtimeVersion=1.0.0',
            '--code', "file://$CodePath",
            '--context', "file://$ContextPath",
            '--function', $Function)
  $json = & aws @args | Out-String
  try { return $json | ConvertFrom-Json } catch { return $null, $json }
}

# Evaluate request
$evalReq = Invoke-EvaluateCode -ApiId $ApiId -CodePath $CreateUserPath -ContextPath $CreateUserReqCtx -Function 'request'
if ($null -eq $evalReq) { Write-Error "[deploy] Failed to parse evaluate-code response for request." }
if ($evalReq.errors -and $evalReq.errors.Count -gt 0) {
  Write-Host ($evalReq | ConvertTo-Json -Depth 6) | Out-String
  Write-Error "[deploy] appsync evaluate-code reported errors for createUser request. Aborting."
} else { Write-Host "[deploy] createUser request evaluation passed." -ForegroundColor Green }

# Evaluate response (optional if context exists)
if (Test-Path $CreateUserRespCtx) {
  $evalRes = Invoke-EvaluateCode -ApiId $ApiId -CodePath $CreateUserPath -ContextPath $CreateUserRespCtx -Function 'response'
  if ($null -eq $evalRes) { Write-Error "[deploy] Failed to parse evaluate-code response for response." }
  if ($evalRes.errors -and $evalRes.errors.Count -gt 0) {
    Write-Host ($evalRes | ConvertTo-Json -Depth 6) | Out-String
    Write-Error "[deploy] appsync evaluate-code reported errors for createUser response. Aborting."
  } else { Write-Host "[deploy] createUser response evaluation passed." -ForegroundColor Green }
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
}
finally {
  Pop-Location
}

Write-Host "[deploy] Done. Restart frontend dev server to pick up env changes." -ForegroundColor Green
