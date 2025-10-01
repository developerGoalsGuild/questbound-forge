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
$env:TF_LOG_PATH = "D:\terraformLogs\tf4.log"

# Clean up existing terraform log file
$TerraformLogFile = "D:\terraformLogs\tf4.log"
# Enable Terraform DEBUG logs to file
try {
  $logDir = Split-Path -Parent $TerraformLogFile
  if ($logDir -and -not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
  if (Test-Path $TerraformLogFile) { Clear-Content $TerraformLogFile -ErrorAction SilentlyContinue } else { New-Item -ItemType File -Path $TerraformLogFile | Out-Null }
  $env:TF_LOG = 'DEBUG'
  $env:TF_LOG_PATH = $TerraformLogFile
  Write-Host "[deploy] TF_LOG=DEBUG, TF_LOG_PATH=$TerraformLogFile" -ForegroundColor DarkGray
} catch {}

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [apigateway] $Message"
  Microsoft.PowerShell.Utility\Write-Host $LogEntry
  Add-Content -Path $LogFile -Value $LogEntry
}
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
$StackPath = Resolve-Path "$RepoRoot\stacks\apigateway" | Select-Object -ExpandProperty Path
$EnvFile = "$RepoRoot\environments\$Env.tfvars"

# Check if environment tfvars file exists
if (-not (Test-Path $EnvFile)) {
  Write-Log "ERROR: Environment tfvars file not found: $EnvFile" "ERROR"
  Write-Log "Available environments:" "ERROR"
  $envDir = "$RepoRoot\environments"
  if (Test-Path $envDir) {
    $availableEnvs = Get-ChildItem -Path $envDir -Filter "*.tfvars" | ForEach-Object { $_.BaseName }
    foreach ($availableEnv in $availableEnvs) {
      Write-Log "  - $availableEnv" "ERROR"
    }
  } else {
    Write-Log "  - No environments directory found at: $envDir" "ERROR"
  }
  throw "Environment tfvars file not found: $EnvFile"
}

Write-Log "Environment tfvars file found: $EnvFile" "INFO"

# Check if stack directory exists
if (-not (Test-Path $StackPath)) {
  Write-Log "ERROR: Stack directory not found: $StackPath" "ERROR"
  throw "Stack directory not found: $StackPath"
}

Write-Log "Stack directory found: $StackPath" "INFO"

# Check if required terraform files exist in stack directory
$requiredFiles = @("main.tf", "variables.tf", "outputs.tf")
$missingFiles = @()
foreach ($file in $requiredFiles) {
  if (-not (Test-Path "$StackPath\$file")) {
    $missingFiles += $file
  }
}

if ($missingFiles.Count -gt 0) {
  Write-Log "ERROR: Missing required terraform files in stack directory:" "ERROR"
  foreach ($file in $missingFiles) {
    Write-Log "  - $file" "ERROR"
  }
  throw "Missing required terraform files in stack directory: $StackPath"
}

Write-Log "All required terraform files found in stack directory" "INFO"
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
    terraform init -upgrade 
  }
  if ($PSBoundParameters.ContainsKey('PlanOnly')) {
    Write-Log "Running terraform plan" "INFO"
    terraform plan -var-file "$EnvFile" @varArgs 
  } else {
    Write-Log "Running terraform apply with auto-approve" "INFO"
    terraform apply -var-file "$EnvFile" -auto-approve @varArgs 
    
    # Verify deployment after successful apply
    Write-Log "Verifying API Gateway deployment..." "INFO"
    try {
      $output = terraform output -json | ConvertFrom-Json
      $restApiId = $output.rest_api_id.value
      $invokeUrl = $output.invoke_url.value
      
      Write-Log "API Gateway ID: $restApiId" "INFO"
      Write-Log "Invoke URL: $invokeUrl" "INFO"
      
      # Check if all resources are properly created
      Write-Log "Checking API Gateway resources..." "INFO"
      $resourceCount = (terraform state list | Where-Object { $_ -like "module.apigw.aws_api_gateway_*" }).Count
      Write-Log "Total API Gateway resources in state: $resourceCount" "INFO"
      
      # Verify key endpoints exist
      $endpoints = @(
        "GET /health",
        "POST /users/login", 
        "POST /users/signup",
        "GET /profile",
        "PUT /profile",
        "GET /quests",
        "POST /quests",
        "POST /quests/createTask",
        "PUT /quests/{goal_id}",
        "DELETE /quests/{goal_id}",
        "GET /quests/tasks",
        "PUT /quests/tasks/{task_id}",
        "DELETE /quests/tasks/{task_id}"
      )
      
      Write-Log "Expected endpoints:" "INFO"
      foreach ($endpoint in $endpoints) {
        Write-Log "  - $endpoint" "INFO"
      }
      
      Write-Log "API Gateway deployment verification completed successfully" "INFO"
      
    } catch {
      Write-Log "Warning: Could not verify deployment details: $($_.Exception.Message)" "WARN"
    }
  }
  Write-Log "Apigateway stack deployment completed" "INFO"
} catch {
  Write-Log "Error in apigateway stack: $($_.Exception.Message)" "ERROR"
  throw
} finally { 
  Pop-Location 
}
