# Verify API Gateway Resources using AWS SDK
param(
    [string]$RestApiId = "3xlvsffmxc",
    [string]$StageName = "v1",
    [string]$Region = "us-east-2"
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] [verify-apigateway] $Message"
    Microsoft.PowerShell.Utility\Write-Host $LogEntry
}

Write-Log "Starting API Gateway resource verification for RestApiId: $RestApiId" "INFO"

try {
    # Check if AWS CLI is available
    $awsVersion = aws --version 2>$null
    if (-not $awsVersion) {
        Write-Log "ERROR: AWS CLI not found. Please install AWS CLI first." "ERROR"
        exit 1
    }
    Write-Log "AWS CLI version: $awsVersion" "INFO"

    # 1. Verify REST API exists
    Write-Log "1. Checking REST API..." "INFO"
    $restApi = aws apigateway get-rest-api --rest-api-id $RestApiId --region $Region 2>$null | ConvertFrom-Json
    if ($restApi) {
        Write-Log "✅ REST API found: $($restApi.name) (ID: $($restApi.id))" "INFO"
        Write-Log "   Description: $($restApi.description)" "INFO"
        Write-Log "   Created: $($restApi.createdDate)" "INFO"
    } else {
        Write-Log "❌ REST API not found with ID: $RestApiId" "ERROR"
        exit 1
    }

    # 2. Verify Stage exists
    Write-Log "2. Checking Stage..." "INFO"
    $stage = aws apigateway get-stage --rest-api-id $RestApiId --stage-name $StageName --region $Region 2>$null | ConvertFrom-Json
    if ($stage) {
        Write-Log "✅ Stage found: $($stage.stageName)" "INFO"
        Write-Log "   Deployment ID: $($stage.deploymentId)" "INFO"
        Write-Log "   X-Ray Tracing: $($stage.tracingEnabled)" "INFO"
        Write-Log "   Cache Cluster: $($stage.cacheClusterEnabled)" "INFO"
    } else {
        Write-Log "❌ Stage '$StageName' not found" "ERROR"
    }

    # 3. Get all resources
    Write-Log "3. Checking API Resources..." "INFO"
    $resources = aws apigateway get-resources --rest-api-id $RestApiId --region $Region 2>$null | ConvertFrom-Json
    if ($resources -and $resources.items) {
        Write-Log "✅ Found $($resources.items.Count) resources" "INFO"
        
        # Expected resource paths
        $expectedPaths = @(
            "/",
            "/health",
            "/users",
            "/users/signup",
            "/users/login",
            "/profile",
            "/auth",
            "/auth/renew",
            "/quests",
            "/quests/createTask",
            "/quests/{goal_id}",
            "/quests/tasks",
            "/quests/tasks/{task_id}"
        )
        
        Write-Log "Expected resource paths:" "INFO"
        foreach ($path in $expectedPaths) {
            Write-Log "  - $path" "INFO"
        }
        
        Write-Log "Actual resource paths:" "INFO"
        foreach ($resource in $resources.items) {
            $path = if ($resource.path -eq "/") { "/" } else { $resource.path }
            Write-Log "  - $path" "INFO"
        }
    } else {
        Write-Log "❌ No resources found" "ERROR"
    }

    # 4. Check methods for each resource
    Write-Log "4. Checking HTTP Methods..." "INFO"
    $methodCount = 0
    foreach ($resource in $resources.items) {
        if ($resource.resourceMethods) {
            foreach ($method in $resource.resourceMethods.Keys) {
                $methodCount++
                Write-Log "  - $($resource.path) [$method]" "INFO"
            }
        }
    }
    Write-Log "✅ Total methods found: $methodCount" "INFO"

    # 5. Verify CloudWatch Log Group
    Write-Log "5. Checking CloudWatch Log Group..." "INFO"
    $logGroupName = "/aws/apigateway/goalsguild_api_dev-$StageName"
    $logGroup = aws logs describe-log-groups --log-group-name-prefix $logGroupName --region $Region 2>$null | ConvertFrom-Json
    if ($logGroup -and $logGroup.logGroups -and $logGroup.logGroups.Count -gt 0) {
        $logGroupDetails = $logGroup.logGroups[0]
        Write-Log "✅ CloudWatch Log Group found: $($logGroupDetails.logGroupName)" "INFO"
        Write-Log "   Retention: $($logGroupDetails.retentionInDays) days" "INFO"
        Write-Log "   Created: $($logGroupDetails.creationTime)" "INFO"
    } else {
        Write-Log "❌ CloudWatch Log Group not found: $logGroupName" "ERROR"
    }

    # 6. Verify IAM Role for API Gateway Logs
    Write-Log "6. Checking IAM Role for API Gateway Logs..." "INFO"
    $roleName = "goalsguild-dev-api-gateway-logs-role"
    $role = aws iam get-role --role-name $roleName --region $Region 2>$null | ConvertFrom-Json
    if ($role -and $role.Role) {
        Write-Log "✅ IAM Role found: $($role.Role.RoleName)" "INFO"
        Write-Log "   ARN: $($role.Role.Arn)" "INFO"
        Write-Log "   Created: $($role.Role.CreateDate)" "INFO"
    } else {
        Write-Log "❌ IAM Role not found: $roleName" "ERROR"
    }

    # 7. Check Lambda Permissions
    Write-Log "7. Checking Lambda Permissions..." "INFO"
    $lambdaFunctions = @(
        "goalsguild_authorizer_dev",
        "goalsguild_user_service_dev", 
        "goalsguild_quest_service_dev"
    )
    
    foreach ($functionName in $lambdaFunctions) {
        $function = aws lambda get-function --function-name $functionName --region $Region 2>$null | ConvertFrom-Json
        if ($function -and $function.Configuration) {
            Write-Log "✅ Lambda function found: $($function.Configuration.FunctionName)" "INFO"
            
            # Check if function has API Gateway invoke permission
            $policy = aws lambda get-policy --function-name $functionName --region $Region 2>$null | ConvertFrom-Json
            if ($policy -and $policy.Policy) {
                $policyDoc = $policy.Policy | ConvertFrom-Json
                $hasApiGatewayPermission = $false
                foreach ($statement in $policyDoc.Statement) {
                    if ($statement.Principal.Service -eq "apigateway.amazonaws.com") {
                        $hasApiGatewayPermission = $true
                        break
                    }
                }
                if ($hasApiGatewayPermission) {
                    Write-Log "  ✅ Has API Gateway invoke permission" "INFO"
                } else {
                    Write-Log "  ❌ Missing API Gateway invoke permission" "ERROR"
                }
            } else {
                Write-Log "  ❌ Could not retrieve function policy" "ERROR"
            }
        } else {
            Write-Log "❌ Lambda function not found: $functionName" "ERROR"
        }
    }

    # 8. Test API Gateway endpoint
    Write-Log "8. Testing API Gateway endpoint..." "INFO"
    $invokeUrl = "https://$RestApiId.execute-api.$Region.amazonaws.com/$StageName"
    Write-Log "Invoke URL: $invokeUrl" "INFO"
    
    # Test health endpoint
    try {
        $healthResponse = Invoke-WebRequest -Uri "$invokeUrl/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
        Write-Log "✅ Health endpoint responded with status: $($healthResponse.StatusCode)" "INFO"
    } catch {
        Write-Log "❌ Health endpoint test failed: $($_.Exception.Message)" "ERROR"
    }

    Write-Log "API Gateway resource verification completed!" "INFO"

} catch {
    Write-Log "Error during verification: $($_.Exception.Message)" "ERROR"
    exit 1
}
