# PowerShell script to deploy messaging service infrastructure only (without Docker image)
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
  $LogEntry = "[$Timestamp] [$Level] [messaging-service-infrastructure] $Message"
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

# Deploy messaging service infrastructure
function Deploy-MessagingInfrastructure {
  param(
    [string]$StackPath,
    [string]$EnvFile,
    [string]$RepoRoot
  )
  
  Write-Log "Deploying messaging service infrastructure" "INFO"
  
  # Change to repository root for Terraform
  Push-Location $RepoRoot
  try {
    if (-not $SkipInit) {
      Write-Log "Running terraform init for messaging service infrastructure" "INFO"
      terraform -chdir="$StackPath" init -upgrade
      
      if ($LASTEXITCODE -ne 0) {
        throw "Terraform init failed for messaging service infrastructure"
      }
    }
    
    if ($PlanOnly) {
      Write-Log "Running terraform plan for messaging service infrastructure" "INFO"
      terraform -chdir="$StackPath" plan -var-file "$EnvFile" -target=aws_ecr_repository.messaging_service
    } else {
      Write-Log "Running terraform apply for messaging service infrastructure" "INFO"
      if ($AutoApprove) {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile" -target=aws_ecr_repository.messaging_service -auto-approve
      } else {
        terraform -chdir="$StackPath" apply -var-file "$EnvFile" -target=aws_ecr_repository.messaging_service
      }
    }
    
    if ($LASTEXITCODE -ne 0) {
      throw "Terraform deployment failed for messaging service infrastructure"
    }
    
    Write-Log "Messaging service infrastructure deployment completed successfully" "INFO"
  } finally {
    Pop-Location
  }
}

# Main execution
try {
  Write-Log "Starting messaging service infrastructure deployment in environment: $Env" "INFO"
  
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
  
  # Check and create ECR repository if needed
  Write-Log "Checking ECR repository..." "INFO"
  & "$Root\create-ecr-if-not-exists.ps1" -Env $Env -RepositoryName "goalsguild_messaging_service"
  
  if ($LASTEXITCODE -ne 0) {
    throw "ECR repository check and creation failed"
  }
  
  # Deploy messaging service infrastructure
  Deploy-MessagingInfrastructure -StackPath $StackPath -EnvFile $EnvFile -RepoRoot $RepoRoot
  
  Write-Log "Messaging service infrastructure deployment completed successfully!" "INFO"
  Write-Host "`nMessaging Service Infrastructure Summary:" -ForegroundColor Green
  Write-Host "- Environment: $Env" -ForegroundColor Green
  Write-Host "- AWS Account: $($AWSInfo.AccountId)" -ForegroundColor Green
  Write-Host "- AWS Region: $($AWSInfo.Region)" -ForegroundColor Green
  Write-Host "- ECR Repository created" -ForegroundColor Green
  Write-Host "- Infrastructure ready for Docker image deployment" -ForegroundColor Green
  
} catch {
  $ErrorMessage = "Error in messaging service infrastructure deployment: $($_.Exception.Message)"
  if ($_.Exception.InnerException) {
    $ErrorMessage += " Inner Exception: $($_.Exception.InnerException.Message)"
  }
  Write-Log $ErrorMessage "ERROR"
  Write-Host "`nMessaging service infrastructure deployment failed!" -ForegroundColor Red
  throw
}
