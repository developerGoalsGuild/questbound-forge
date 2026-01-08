# PowerShell script to deploy only ECR repository and infrastructure (no Lambda function)
param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [switch]$PlanOnly,
  [switch]$AutoApprove = $true,
  [switch]$SkipInit
)

$ErrorActionPreference = "Stop"

# Set console output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [messaging-service-ecr-only] $Message"
  Microsoft.PowerShell.Utility\Write-Host $LogEntry
}

# Get AWS information
function Get-AWSInfo {
  try {
    Write-Log "Getting AWS account ID..." "INFO"
    $AccountId = (aws sts get-caller-identity --query Account --output text 2>$null)
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to get AWS account ID. Make sure AWS CLI is configured and you have valid credentials."
    }
    
    Write-Log "Getting AWS region..." "INFO"
    $Region = (aws configure get region 2>$null)
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to get AWS region. Make sure AWS CLI is configured."
    }
    
    if (-not $AccountId -or -not $Region) {
      throw "Failed to get AWS account ID or region. AccountId: '$AccountId', Region: '$Region'"
    }
    
    Write-Log "AWS Account: $AccountId, Region: $Region" "INFO"
    
    return @{
      AccountId = $AccountId
      Region = $Region
    }
  } catch {
    Write-Log "Error getting AWS info: $($_.Exception.Message)" "ERROR"
    throw
  }
}

# Deploy messaging service ECR and infrastructure only
function Deploy-MessagingECR {
  param(
    [string]$StackPath,
    [string]$EnvFile,
    [string]$RepoRoot
  )
  
  Write-Log "Deploying messaging service ECR and infrastructure only" "INFO"
  
  # Change to repository root for Terraform
  Push-Location $RepoRoot
  try {
    if (-not $SkipInit) {
      Write-Log "Running terraform init for messaging service ECR" "INFO"
      terraform -chdir="$StackPath" init -upgrade
      
      if ($LASTEXITCODE -ne 0) {
        throw "Terraform init failed for messaging service ECR"
      }
    }
    
    # Target only ECR repository and infrastructure resources
    $Targets = @(
      "aws_ecr_repository.messaging_service",
      "aws_secretsmanager_secret.jwt_secret",
      "aws_secretsmanager_secret_version.jwt_secret",
      "aws_iam_policy.messaging_service_dynamodb_policy",
      "aws_iam_policy.messaging_service_secrets_policy"
    )
    
    if ($PlanOnly) {
      Write-Log "Running terraform plan for messaging service ECR" "INFO"
      $TargetString = ($Targets | ForEach-Object { "-target=$_" }) -join " "
      terraform -chdir="$StackPath" plan -var-file "$EnvFile" $TargetString
    } else {
      Write-Log "Running terraform apply for messaging service ECR" "INFO"
      $TargetString = ($Targets | ForEach-Object { "-target=$_" }) -join " "
      if ($AutoApprove) {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile" $TargetString -auto-approve
      } else {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile" $TargetString
      }
    }
    
    if ($LASTEXITCODE -ne 0) {
      throw "Terraform deployment failed for messaging service ECR"
    }
    
    Write-Log "Messaging service ECR deployment completed successfully" "INFO"
  } finally {
    Pop-Location
  }
}

# Main execution
try {
  Write-Log "Starting messaging service ECR deployment in environment: $Env" "INFO"
  
  # Get AWS information
  $AWSInfo = Get-AWSInfo
  Write-Log "AWS Account: $($AWSInfo.AccountId), Region: $($AWSInfo.Region)" "INFO"
  
  # Get paths
  $Root = Split-Path -Parent $MyInvocation.MyCommand.Path
  $RepoRoot = Resolve-Path "$Root\.." | Select-Object -ExpandProperty Path
  $StackPath = "$RepoRoot\stacks\services\messaging-service"
  $EnvFile = Resolve-Path "$RepoRoot\environments\$Env.tfvars" | Select-Object -ExpandProperty Path
  
  Write-Log "Repository root: $RepoRoot" "INFO"
  Write-Log "Stack path: $StackPath" "INFO"
  Write-Log "Environment file: $EnvFile" "INFO"
  
  # Check if environment file exists
  if (-not (Test-Path $EnvFile)) {
    throw "Environment file not found: $EnvFile. Please create the environment file first."
  }
  
  # Deploy messaging service ECR and infrastructure
  Deploy-MessagingECR -StackPath $StackPath -EnvFile $EnvFile -RepoRoot $RepoRoot
  
  Write-Log "Messaging service ECR deployment completed successfully!" "INFO"
  Write-Host "`nMessaging Service ECR Summary:" -ForegroundColor Green
  Write-Host "- Environment: $Env" -ForegroundColor Green
  Write-Host "- AWS Account: $($AWSInfo.AccountId)" -ForegroundColor Green
  Write-Host "- AWS Region: $($AWSInfo.Region)" -ForegroundColor Green
  Write-Host "- ECR Repository: Created" -ForegroundColor Green
  Write-Host "- JWT Secret: Created" -ForegroundColor Green
  Write-Host "- IAM Policies: Created" -ForegroundColor Green
  Write-Host "- Ready for Docker image deployment" -ForegroundColor Green
  
} catch {
  $ErrorMessage = "Error in messaging service ECR deployment: $($_.Exception.Message)"
  if ($_.Exception.InnerException) {
    $ErrorMessage += " Inner Exception: $($_.Exception.InnerException.Message)"
  }
  Write-Log $ErrorMessage "ERROR"
  Write-Host "`nMessaging service ECR deployment failed!" -ForegroundColor Red
  throw
}
