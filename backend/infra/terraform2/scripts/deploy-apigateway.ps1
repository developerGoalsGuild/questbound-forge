param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$SkipInit,
  [string]$AuthorizerArn = "",
  [string]$UserLambdaArn = "",
  [string]$QuestLambdaArn = ""
)
$ErrorActionPreference = "Stop"

# Setup logging
$LogDir = "D:\terraformlogs"
$LogFile = "$LogDir\tf2.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# Set Terraform logging environment variable
$env:TF_LOG_PATH = "D:\terraformLogs\tf3.log"

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [apigateway] $Message"
  Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
$StackPath = Resolve-Path "$RepoRoot\stacks\apigateway" | Select-Object -ExpandProperty Path
$EnvFile = Resolve-Path "$RepoRoot\environments\$Env.tfvars" | Select-Object -ExpandProperty Path
Write-Log "Starting apigateway stack deployment for environment: $Env" "INFO"
Push-Location $StackPath
# Build optional -var overrides if provided
$varArgs = @()
if ($AuthorizerArn -ne "") { 
  $varArgs += @('-var', "lambda_authorizer_arn_override=$AuthorizerArn")
  Write-Log "Using override AuthorizerArn: $AuthorizerArn" "INFO"
}
if ($UserLambdaArn -ne "") { 
  $varArgs += @('-var', "user_service_lambda_arn_override=$UserLambdaArn")
  Write-Log "Using override UserLambdaArn: $UserLambdaArn" "INFO"
}
if ($QuestLambdaArn -ne "") { 
  $varArgs += @('-var', "quest_service_lambda_arn_override=$QuestLambdaArn")
  Write-Log "Using override QuestLambdaArn: $QuestLambdaArn" "INFO"
}
try {
  if (-not $SkipInit) { 
    Write-Log "Running terraform init" "INFO"
    terraform init -upgrade 2>&1 | Tee-Object -FilePath $LogFile -Append
  }
  if ($PSBoundParameters.ContainsKey('PlanOnly')) {
    Write-Log "Running terraform plan" "INFO"
    terraform plan -var-file "$EnvFile" @varArgs 2>&1 | Tee-Object -FilePath $LogFile -Append
  } else {
    Write-Log "Running terraform apply with auto-approve" "INFO"
    terraform apply -var-file "$EnvFile" -auto-approve @varArgs 2>&1 | Tee-Object -FilePath $LogFile -Append
  }
  Write-Log "Apigateway stack deployment completed" "INFO"
} catch {
  Write-Log "Error in apigateway stack: $($_.Exception.Message)" "ERROR"
  throw
} finally { 
  Pop-Location 
}
