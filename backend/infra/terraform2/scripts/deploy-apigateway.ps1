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
      
      # Verify API Gateway resources via AWS CLI
      Write-Log "Verifying API Gateway resources via AWS CLI..." "INFO"
      try {
        $awsResources = aws apigateway get-resources --rest-api-id $restApiId --query "items[?resourceMethods].{Path:pathPart,Methods:resourceMethods}" --output json | ConvertFrom-Json
        
        if ($awsResources) {
          Write-Log "Found $($awsResources.Count) API Gateway resources with methods:" "INFO"
          foreach ($resource in $awsResources) {
            $path = if ($resource.Path) { $resource.Path } else { "/" }
            $methods = if ($resource.Methods) { ($resource.Methods.PSObject.Properties.Name -join ", ") } else { "None" }
            Write-Log "  $path - Methods: $methods" "INFO"
          }
          
          # Debug: Show first few resources in detail
          Write-Log "Debug - First 3 resources structure:" "DEBUG"
          for ($i = 0; $i -lt [Math]::Min(3, $awsResources.Count); $i++) {
            $resource = $awsResources[$i]
            Write-Log "  Resource ${i}: Path='$($resource.Path)', Methods=$($resource.Methods | ConvertTo-Json -Compress)" "DEBUG"
          }
        } else {
          Write-Log "Warning: No API Gateway resources found via AWS CLI" "WARN"
        }
      } catch {
        Write-Log "Warning: Could not verify API Gateway resources via AWS CLI: $($_.Exception.Message)" "WARN"
      }
      
      # Check API Gateway stage deployment status
      Write-Log "Checking API Gateway stage deployment status..." "INFO"
      try {
        $stageInfo = aws apigateway get-stage --rest-api-id $restApiId --stage-name "v1" --output json | ConvertFrom-Json
        if ($stageInfo) {
          Write-Log "Stage deployment status: $($stageInfo.deploymentId)" "INFO"
          Write-Log "Stage description: $($stageInfo.description)" "INFO"
          Write-Log "Stage created: $($stageInfo.createdDate)" "INFO"
          Write-Log "Stage last updated: $($stageInfo.lastUpdatedDate)" "INFO"
        }
      } catch {
        Write-Log "Warning: Could not get stage information: $($_.Exception.Message)" "WARN"
      }
      
      # Check API Gateway authorizers
      Write-Log "Checking API Gateway authorizers..." "INFO"
      try {
        $authorizers = aws apigateway get-authorizers --rest-api-id $restApiId --output json | ConvertFrom-Json
        if ($authorizers -and $authorizers.items) {
          Write-Log "Found $($authorizers.items.Count) authorizers:" "INFO"
          foreach ($authorizer in $authorizers.items) {
            Write-Log "  - $($authorizer.name) (Type: $($authorizer.type), ID: $($authorizer.id))" "INFO"
          }
        } else {
          Write-Log "Warning: No authorizers found" "WARN"
        }
      } catch {
        Write-Log "Warning: Could not get authorizer information: $($_.Exception.Message)" "WARN"
      }
      
      # Check API Gateway usage plans and API keys
      Write-Log "Checking API Gateway usage plans and API keys..." "INFO"
      try {
        $usagePlans = aws apigateway get-usage-plans --output json | ConvertFrom-Json
        if ($usagePlans -and $usagePlans.items) {
          Write-Log "Found $($usagePlans.items.Count) usage plans:" "INFO"
          foreach ($plan in $usagePlans.items) {
            Write-Log "  - $($plan.name) (ID: $($plan.id))" "INFO"
          }
        }
        
        $apiKeys = aws apigateway get-api-keys --output json | ConvertFrom-Json
        if ($apiKeys -and $apiKeys.items) {
          Write-Log "Found $($apiKeys.items.Count) API keys:" "INFO"
          foreach ($key in $apiKeys.items) {
            Write-Log "  - $($key.name) (ID: $($key.id), Enabled: $($key.enabled))" "INFO"
          }
        }
      } catch {
        Write-Log "Warning: Could not get usage plan or API key information: $($_.Exception.Message)" "WARN"
      }
      
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
        "DELETE /quests/tasks/{task_id}",
        # Quest management endpoints
        "POST /quests/createQuest",
        "POST /quests/quests/{quest_id}/start",
        "PUT /quests/quests/{quest_id}",
        "POST /quests/quests/{quest_id}/cancel",
        "POST /quests/quests/{quest_id}/fail",
        "DELETE /quests/quests/{quest_id}",
        # New REST endpoints for goals and quests
        "GET /quests/{goal_id}",
        "GET /quests/quests/{quest_id}",
        # Collaboration endpoints
        "GET /collaborations/my-collaborations",
        "POST /collaborations/invite",
        "GET /collaborations/invites",
        "POST /collaborations/invites/{invite_id}/accept",
        "POST /collaborations/invites/{invite_id}/decline",
        "GET /collaborations/resources/{resource_type}/{resource_id}/collaborators",
        "GET /collaborations/resources/{resource_type}/{resource_id}/comments",
        "POST /collaborations/resources/{resource_type}/{resource_id}/comments",
        "PUT /collaborations/comments/{comment_id}",
        "DELETE /collaborations/comments/{comment_id}",
        "POST /collaborations/comments/{comment_id}/reactions",
        "DELETE /collaborations/comments/{comment_id}/reactions/{reaction_id}",
        "GET /collaborations/access/{resource_type}/{resource_id}"
      )
      
      Write-Log "Expected endpoints:" "INFO"
      foreach ($endpoint in $endpoints) {
        Write-Log "  - $endpoint" "INFO"
      }
      
      # Check if all endpoints are deployed via AWS SDK
      Write-Log "Checking if all endpoints are deployed..." "INFO"
      $deploymentCheck = @{
        # Health endpoints
        "Health Check" = @{ Path = "/health"; Method = "GET" }
        
        # User endpoints
        "User Signup" = @{ Path = "/users/signup"; Method = "POST" }
        "User Login" = @{ Path = "/users/login"; Method = "POST" }
        "Profile Get" = @{ Path = "/profile"; Method = "GET" }
        "Profile Update" = @{ Path = "/profile"; Method = "PUT" }
        "Auth Renew" = @{ Path = "/auth/renew"; Method = "POST" }
        
        # Quest endpoints
        "Get Quests" = @{ Path = "/quests"; Method = "GET" }
        "Create Quest" = @{ Path = "/quests"; Method = "POST" }
        "Get Goal" = @{ Path = "/quests/{goal_id}"; Method = "GET" }
        "Update Goal" = @{ Path = "/quests/{goal_id}"; Method = "PUT" }
        "Delete Goal" = @{ Path = "/quests/{goal_id}"; Method = "DELETE" }
        "Create Task" = @{ Path = "/quests/createTask"; Method = "POST" }
        "Update Task" = @{ Path = "/quests/tasks/{task_id}"; Method = "PUT" }
        "Delete Task" = @{ Path = "/quests/tasks/{task_id}"; Method = "DELETE" }
        "Get Progress" = @{ Path = "/quests/progress"; Method = "GET" }
        "Get Goal Progress" = @{ Path = "/quests/{goal_id}/progress"; Method = "GET" }
        
        # Quest management endpoints
        "Create Quest Management" = @{ Path = "/quests/createQuest"; Method = "POST" }
        "Get Quest" = @{ Path = "/quests/quests/{quest_id}"; Method = "GET" }
        "Update Quest" = @{ Path = "/quests/quests/{quest_id}"; Method = "PUT" }
        "Start Quest" = @{ Path = "/quests/quests/{quest_id}/start"; Method = "POST" }
        "Cancel Quest" = @{ Path = "/quests/quests/{quest_id}/cancel"; Method = "POST" }
        "Fail Quest" = @{ Path = "/quests/quests/{quest_id}/fail"; Method = "POST" }
        "Delete Quest" = @{ Path = "/quests/quests/{quest_id}"; Method = "DELETE" }
        "Check Completion" = @{ Path = "/quests/check-completion"; Method = "POST" }
        "Quest Analytics" = @{ Path = "/quests/analytics"; Method = "GET" }
        
        # Quest templates endpoints
        "Get Templates" = @{ Path = "/quests/templates"; Method = "GET" }
        "Create Template" = @{ Path = "/quests/templates"; Method = "POST" }
        "Get Template" = @{ Path = "/quests/templates/{template_id}"; Method = "GET" }
        "Update Template" = @{ Path = "/quests/templates/{template_id}"; Method = "PUT" }
        "Delete Template" = @{ Path = "/quests/templates/{template_id}"; Method = "DELETE" }
        
        # Collaboration endpoints
        "My Collaborations" = @{ Path = "/collaborations/my-collaborations"; Method = "GET" }
        "Create Invite" = @{ Path = "/collaborations/invite"; Method = "POST" }
        "Get Invites" = @{ Path = "/collaborations/invites"; Method = "GET" }
        "Accept Invite" = @{ Path = "/collaborations/invites/{invite_id}/accept"; Method = "POST" }
        "Decline Invite" = @{ Path = "/collaborations/invites/{invite_id}/decline"; Method = "POST" }
        "Get Collaborators" = @{ Path = "/collaborations/resources/{resource_type}/{resource_id}/collaborators"; Method = "GET" }
        "Remove Collaborator" = @{ Path = "/collaborations/resources/{resource_type}/{resource_id}/collaborators/{user_id}"; Method = "DELETE" }
        "Get Comments" = @{ Path = "/collaborations/resources/{resource_type}/{resource_id}/comments"; Method = "GET" }
        "Create Comment" = @{ Path = "/collaborations/comments"; Method = "POST" }
        "Get Comment" = @{ Path = "/collaborations/comments/{comment_id}"; Method = "GET" }
        "Update Comment" = @{ Path = "/collaborations/comments/{comment_id}"; Method = "PUT" }
        "Delete Comment" = @{ Path = "/collaborations/comments/{comment_id}"; Method = "DELETE" }
        "Add Reaction" = @{ Path = "/collaborations/comments/{comment_id}/reactions"; Method = "POST" }
        "Remove Reaction" = @{ Path = "/collaborations/comments/{comment_id}/reactions/{reaction_id}"; Method = "DELETE" }
        "Check Access" = @{ Path = "/collaborations/access/{resource_type}/{resource_id}"; Method = "GET" }
      }
      
      $deployedEndpoints = 0
      $totalEndpoints = $deploymentCheck.Count
      
      foreach ($endpointName in $deploymentCheck.Keys) {
        $endpoint = $deploymentCheck[$endpointName]
        $path = $endpoint.Path
        $method = $endpoint.Method
        
        try {
          # Check if the resource path exists in API Gateway
          $resourceExists = $false
          
          if ($awsResources) {
            foreach ($resource in $awsResources) {
              $resourcePath = if ($resource.Path) { $resource.Path } else { "/" }
              
              # More flexible path matching
              $pathMatch = $false
              
              # The AWS CLI returns resource paths as individual segments, not full paths
              # We need to match based on the last segment of the expected path
              $expectedLastSegment = $path.Split('/')[-1]
              $resourceLastSegment = $resourcePath.Split('/')[-1]
              
              # Debug output for first few checks
              if ($endpointName -in @("Health Check", "User Signup", "Get Quests")) {
                Write-Log "    Debug: Expected='$path' (last: '$expectedLastSegment'), Resource='$resourcePath' (last: '$resourceLastSegment')" "DEBUG"
              }
              
              # Direct segment match
              if ($resourceLastSegment -eq $expectedLastSegment) {
                $pathMatch = $true
              }
              # Handle parameterized paths like {goal_id}, {quest_id}, etc.
              elseif ($expectedLastSegment -like "{*}" -and $resourceLastSegment -like "{*}") {
                # Both are parameters, check if they're the same type
                if ($expectedLastSegment -eq $resourceLastSegment) {
                  $pathMatch = $true
                }
              }
              # Handle cases where the resource path might be a partial match
              elseif ($resourceLastSegment -like "*$expectedLastSegment*" -or $expectedLastSegment -like "*$resourceLastSegment*") {
                $pathMatch = $true
              }
              
              if ($pathMatch) {
                # Check if the method exists for this resource
                if ($resource.Methods -and $resource.Methods.$method) {
                  $resourceExists = $true
                  if ($endpointName -in @("Health Check", "User Signup", "Get Quests")) {
                    Write-Log "    Debug: FOUND MATCH for $endpointName at $resourcePath with method $method" "DEBUG"
                  }
                  break
                } else {
                  if ($endpointName -in @("Health Check", "User Signup", "Get Quests")) {
                    $availableMethods = if ($resource.Methods) { ($resource.Methods.PSObject.Properties.Name -join ", ") } else { "None" }
                    Write-Log "    Debug: Path matched but method $method not found. Available: $availableMethods" "DEBUG"
                  }
                }
              }
            }
          }
          
          if ($resourceExists) {
            Write-Host "  ✓ $endpointName ($method $path)" -ForegroundColor Green
            Write-Log "  ✓ $endpointName ($method $path) - DEPLOYED" "INFO"
            $deployedEndpoints++
          } else {
            Write-Host "  ✗ $endpointName ($method $path)" -ForegroundColor Red
            Write-Log "  ✗ $endpointName ($method $path) - NOT DEPLOYED" "WARN"
            
            # Show available methods for similar paths for debugging
            if ($awsResources) {
              $similarPaths = $awsResources | Where-Object { 
                $rp = if ($_.Path) { $_.Path } else { "/" }
                $rp -like "*$($path.Split('/')[-1])*" 
              }
              if ($similarPaths) {
                foreach ($sp in $similarPaths) {
                  $spPath = if ($sp.Path) { $sp.Path } else { "/" }
                  $spMethods = if ($sp.Methods) { ($sp.Methods.PSObject.Properties.Name -join ", ") } else { "None" }
                  Write-Log "    Similar: $spPath - Methods: $spMethods" "DEBUG"
                }
              }
            }
          }
        } catch {
          Write-Host "  ? $endpointName ($method $path) - CHECK FAILED" -ForegroundColor Yellow
          Write-Log "  ? $endpointName ($method $path) - CHECK FAILED: $($_.Exception.Message)" "WARN"
        }
      }
      
      # Deployment Summary
      Write-Host "`n=== DEPLOYMENT SUMMARY ===" -ForegroundColor Cyan
      Write-Host "Deployed Endpoints: $deployedEndpoints/$totalEndpoints" -ForegroundColor White
      
      # Category breakdown
      $categories = @{
        "Health" = @("Health Check")
        "User" = @("User Signup", "User Login", "Profile Get", "Profile Update", "Auth Renew")
        "Quest" = @("Get Quests", "Create Quest", "Get Goal", "Update Goal", "Delete Goal", "Create Task", "Update Task", "Delete Task", "Get Progress", "Get Goal Progress")
        "Quest Management" = @("Create Quest Management", "Get Quest", "Update Quest", "Start Quest", "Cancel Quest", "Fail Quest", "Delete Quest", "Check Completion", "Quest Analytics")
        "Quest Templates" = @("Get Templates", "Create Template", "Get Template", "Update Template", "Delete Template")
        "Collaboration" = @("My Collaborations", "Create Invite", "Get Invites", "Accept Invite", "Decline Invite", "Get Collaborators", "Remove Collaborator", "Get Comments", "Create Comment", "Get Comment", "Update Comment", "Delete Comment", "Add Reaction", "Remove Reaction", "Check Access")
      }
      
      Write-Host "`n=== CATEGORY BREAKDOWN ===" -ForegroundColor Cyan
      foreach ($category in $categories.Keys) {
        $categoryEndpoints = $categories[$category]
        $categoryDeployed = 0
        foreach ($endpointName in $categoryEndpoints) {
          if ($deploymentCheck.ContainsKey($endpointName)) {
            # Check if this endpoint was deployed (simplified check)
            $endpoint = $deploymentCheck[$endpointName]
            $path = $endpoint.Path
            $method = $endpoint.Method
            
            $isDeployed = $false
            if ($awsResources) {
              foreach ($resource in $awsResources) {
                $resourcePath = if ($resource.Path) { $resource.Path } else { "/" }
                if (($resourcePath -eq $path -or $resourcePath -like "*$($path.Split('/')[-1])*") -and $resource.Methods -and $resource.Methods.$method) {
                  $isDeployed = $true
                  break
                }
              }
            }
            if ($isDeployed) { $categoryDeployed++ }
          }
        }
        $categoryTotal = $categoryEndpoints.Count
        $categoryStatus = if ($categoryDeployed -eq $categoryTotal) { "✓" } else { "⚠" }
        $categoryColor = if ($categoryDeployed -eq $categoryTotal) { "Green" } else { "Yellow" }
        
        Write-Host "  $categoryStatus $category`: $categoryDeployed/$categoryTotal" -ForegroundColor $categoryColor
        Write-Log "  $categoryStatus $category`: $categoryDeployed/$categoryTotal" "INFO"
      }
      
      if ($deployedEndpoints -eq $totalEndpoints) {
        Write-Host "`n✓ All endpoints are deployed!" -ForegroundColor Green
        Write-Log "✓ All endpoints are deployed!" "INFO"
      } else {
        Write-Host "`n⚠ Some endpoints may not be deployed properly" -ForegroundColor Yellow
        Write-Log "⚠ Some endpoints may not be deployed properly" "WARN"
        Write-Host "Check the detailed list above for specific missing endpoints." -ForegroundColor Yellow
      }
      
      Write-Log "=== DEPLOYMENT SUMMARY ===" "INFO"
      Write-Log "Deployed Endpoints: $deployedEndpoints/$totalEndpoints" "INFO"
      
      Write-Log "API Gateway deployment verification completed" "INFO"
      
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
