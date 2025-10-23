# PowerShell script to create ECR repository only if it doesn't exist
param(
  [ValidateSet("dev","staging","prod")] [string]$Env = "dev",
  [string]$RepositoryName = "goalsguild_messaging_service"
)

$ErrorActionPreference = "Stop"

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $LogEntry = "[$Timestamp] [$Level] [ecr-check-create] $Message"
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

# Check if ECR repository exists
function Test-ECRRepository {
  param(
    [string]$RepositoryName,
    [string]$Region
  )
  
  try {
    Write-Log "Checking if ECR repository '$RepositoryName' exists..." "INFO"
    $Result = aws ecr describe-repositories --repository-names $RepositoryName --region $Region 2>$null
    
    if ($LASTEXITCODE -eq 0) {
      Write-Log "ECR repository '$RepositoryName' already exists" "INFO"
      return $true
    } else {
      Write-Log "ECR repository '$RepositoryName' does not exist" "INFO"
      return $false
    }
  } catch {
    Write-Log "Error checking ECR repository: $($_.Exception.Message)" "ERROR"
    return $false
  }
}

# Create ECR repository
function New-ECRRepository {
  param(
    [string]$RepositoryName,
    [string]$Region
  )
  
  try {
    Write-Log "Creating ECR repository '$RepositoryName'..." "INFO"
    
    # Create repository
    aws ecr create-repository --repository-name $RepositoryName --region $Region --image-scanning-configuration scanOnPush=true --image-tag-mutability MUTABLE
    
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to create ECR repository"
    }
    
    Write-Log "ECR repository '$RepositoryName' created successfully" "INFO"
    return $true
  } catch {
    Write-Log "Error creating ECR repository: $($_.Exception.Message)" "ERROR"
    return $false
  }
}

# Main execution
try {
  Write-Log "Starting ECR repository check and creation for: $RepositoryName" "INFO"
  
  # Get AWS information
  $AWSInfo = Get-AWSInfo
  
  # Check if repository exists
  $RepositoryExists = Test-ECRRepository -RepositoryName $RepositoryName -Region $AWSInfo.Region
  
  if (-not $RepositoryExists) {
    # Create repository if it doesn't exist
    $Created = New-ECRRepository -RepositoryName $RepositoryName -Region $AWSInfo.Region
    
    if ($Created) {
      Write-Log "ECR repository creation completed successfully!" "INFO"
      Write-Host "`nECR Repository Summary:" -ForegroundColor Green
      Write-Host "- Repository: $RepositoryName" -ForegroundColor Green
      Write-Host "- AWS Account: $($AWSInfo.AccountId)" -ForegroundColor Green
      Write-Host "- AWS Region: $($AWSInfo.Region)" -ForegroundColor Green
      Write-Host "- Status: Created" -ForegroundColor Green
    } else {
      throw "Failed to create ECR repository"
    }
  } else {
    Write-Log "ECR repository already exists, skipping creation" "INFO"
    Write-Host "`nECR Repository Summary:" -ForegroundColor Yellow
    Write-Host "- Repository: $RepositoryName" -ForegroundColor Yellow
    Write-Host "- AWS Account: $($AWSInfo.AccountId)" -ForegroundColor Yellow
    Write-Host "- AWS Region: $($AWSInfo.Region)" -ForegroundColor Yellow
    Write-Host "- Status: Already exists" -ForegroundColor Yellow
  }
  
} catch {
  $ErrorMessage = "Error in ECR repository check and creation: $($_.Exception.Message)"
  if ($_.Exception.InnerException) {
    $ErrorMessage += " Inner Exception: $($_.Exception.InnerException.Message)"
  }
  Write-Log $ErrorMessage "ERROR"
  Write-Host "`nECR repository check and creation failed!" -ForegroundColor Red
  throw
}
