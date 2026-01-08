param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit
)
$ErrorActionPreference = "Stop"

# Setup logging
$LogDir = "D:\terraformlogs"
$LogFile = "$LogDir\tf-subscription.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# Set Terraform logging environment variable
$env:TF_LOG_PATH = "D:\terraformLogs\tf-subscription.log"

if (-not (Test-Path $env:TF_LOG_PATH)) {
  $logDir = Split-Path -Parent $env:TF_LOG_PATH
  if ($logDir -and -not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
  New-Item -ItemType File -Path $env:TF_LOG_PATH | Out-Null
} else {
  Clear-Content $env:TF_LOG_PATH -ErrorAction SilentlyContinue
}
$env:TF_LOG = 'DEBUG'

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [subscription-auth] $Message"
  Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
$ServicePath = Resolve-Path (Join-Path $Root "..\..\..\services\authorizer-service") | Select-Object -ExpandProperty Path
$StackPath = Resolve-Path "$RepoRoot\stacks\authorizer" | Select-Object -ExpandProperty Path
$EnvFile = Resolve-Path "$RepoRoot\environments\$Env.tfvars" | Select-Object -ExpandProperty Path
Write-Log "Starting subscription auth deployment for environment: $Env" "INFO"

function Get-TfVarValue {
  param(
    [string]$FilePath,
    [string]$Key
  )
  if (-not (Test-Path $FilePath)) { return $null }
  $content = Get-Content -Path $FilePath -Raw
  $pattern = [regex]::Escape($Key) + '\s*=\s*"(.*?)"'
  $match = [regex]::Matches($content, $pattern)
  if ($match.Count -gt 0) {
    return $match[0].Groups[1].Value
  }
  return $null
}

$awsRegion = Get-TfVarValue -FilePath $EnvFile -Key "aws_region"
$subscriptionArnOverride = Get-TfVarValue -FilePath $EnvFile -Key "lambda_subscription_auth_arn_override"

if (-not $PlanOnly) {
  $buildPath = Join-Path $ServicePath "build-subscription"
  $zipPath = Join-Path $ServicePath "subscription_auth.zip"
  Write-Log "Packaging subscription auth Lambda code" "INFO"

  if (Test-Path $buildPath) { Remove-Item $buildPath -Recurse -Force }
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

  New-Item -ItemType Directory -Path $buildPath | Out-Null

  Write-Log "Installing Python dependencies" "INFO"
  & python -m pip install -r (Join-Path $ServicePath "requirements-subscription.txt") -t $buildPath --upgrade

  $moduleFiles = @("subscription_auth.py","security.py","ssm.py","cognito.py")
  foreach ($module in $moduleFiles) {
    Copy-Item -Path (Join-Path $ServicePath $module) -Destination $buildPath -Force
  }

  Write-Log "Creating deployment archive at $zipPath" "INFO"
  Compress-Archive -Path (Join-Path $buildPath '*') -DestinationPath $zipPath -Force

  $subscriptionFunctionMap = @{
    "dev"     = "goalsguild_subscription_auth_dev"
    "staging" = "goalsguild_subscription_auth_staging"
    "prod"    = "goalsguild_subscription_auth_prod"
    "test"    = "goalsguild_subscription_auth_test"
    "local"   = "goalsguild_subscription_auth_local"
  }

  if ($subscriptionArnOverride -and $subscriptionArnOverride.Trim().Length -gt 0) {
    $subscriptionFunctionIdentifier = $subscriptionArnOverride.Trim()
    if (-not $awsRegion -or $awsRegion -eq "") {
      $arnParts = $subscriptionFunctionIdentifier.Split(":")
      if ($arnParts.Count -ge 4) { $awsRegion = $arnParts[3] }
    }
  } else {
    if (-not $subscriptionFunctionMap.ContainsKey($Env)) {
      throw "No subscription auth Lambda mapping defined for environment '$Env'."
    }
    $subscriptionFunctionIdentifier = $subscriptionFunctionMap[$Env]
  }

  if (-not $awsRegion -or $awsRegion -eq "") { $awsRegion = "us-east-1" }

  $functionExists = $false
  try {
    & aws lambda get-function --region $awsRegion --function-name $subscriptionFunctionIdentifier | Out-Null
    $functionExists = $true
  } catch {
    Write-Log "Lambda function $subscriptionFunctionIdentifier not found. Terraform apply will create it." "WARN"
  }

  if ($functionExists) {
    Write-Log "Updating subscription auth Lambda function for $subscriptionFunctionIdentifier" "INFO"
    & aws lambda update-function-code --region $awsRegion --function-name $subscriptionFunctionIdentifier --zip-file ("fileb://{0}" -f $zipPath) --publish | Out-Null
  }

  if (Test-Path $buildPath) { Remove-Item $buildPath -Recurse -Force }
}

Push-Location $StackPath
try {
  if (-not $SkipInit) {
    Write-Log "Running terraform init" "INFO"
    terraform init -upgrade
  }
  if ($PlanOnly) {
    Write-Log "Running terraform plan" "INFO"
    terraform plan -var-file="$EnvFile"
  } else {
    if ($AutoApprove) {
      Write-Log "Running terraform apply with auto-approve" "INFO"
      terraform apply -var-file="$EnvFile" -auto-approve
    } else {
      Write-Log "Running terraform apply" "INFO"
      terraform apply -var-file="$EnvFile"
    }
  }
  Write-Log "Subscription auth deployment completed" "INFO"
} catch {
  Write-Log "Error deploying subscription auth Lambda: $($_.Exception.Message)" "ERROR"
  throw
} finally {
  Pop-Location
}
