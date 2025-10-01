# Simple AWS Resources Check
param(
    [string]$RestApiId = "3xlvsffmxc",
    [string]$Region = "us-east-2"
)

$ErrorActionPreference = "Stop"

Write-Host "=== AWS API Gateway Resources Check ===" -ForegroundColor Green

try {
    # 1. Check REST API
    Write-Host "1. Checking REST API..." -ForegroundColor Yellow
    $restApi = aws apigateway get-rest-api --rest-api-id $RestApiId --region $Region 2>$null | ConvertFrom-Json
    if ($restApi) {
        Write-Host "✅ REST API: $($restApi.name) (ID: $($restApi.id))" -ForegroundColor Green
    } else {
        Write-Host "❌ REST API not found" -ForegroundColor Red
        exit 1
    }

    # 2. Check Stages
    Write-Host "2. Checking Stages..." -ForegroundColor Yellow
    $stages = aws apigateway get-stages --rest-api-id $RestApiId --region $Region 2>$null | ConvertFrom-Json
    if ($stages -and $stages.item -and $stages.item.Count -gt 0) {
        Write-Host "✅ Found $($stages.item.Count) stage(s):" -ForegroundColor Green
        foreach ($stage in $stages.item) {
            Write-Host "   - $($stage.stageName)" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ No stages found" -ForegroundColor Red
    }

    # 3. Check Resources
    Write-Host "3. Checking Resources..." -ForegroundColor Yellow
    $resources = aws apigateway get-resources --rest-api-id $RestApiId --region $Region 2>$null | ConvertFrom-Json
    if ($resources -and $resources.items) {
        Write-Host "✅ Found $($resources.items.Count) resources" -ForegroundColor Green
        foreach ($resource in $resources.items) {
            $path = if ($resource.path -eq "/") { "/" } else { $resource.path }
            Write-Host "   - $path" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ No resources found" -ForegroundColor Red
    }

    # 4. Check CloudWatch Log Groups
    Write-Host "4. Checking CloudWatch Log Groups..." -ForegroundColor Yellow
    $logGroups = aws logs describe-log-groups --log-group-name-prefix "/aws/apigateway/goalsguild_api_dev" --region $Region 2>$null | ConvertFrom-Json
    if ($logGroups -and $logGroups.logGroups -and $logGroups.logGroups.Count -gt 0) {
        Write-Host "✅ Found $($logGroups.logGroups.Count) log group(s):" -ForegroundColor Green
        foreach ($logGroup in $logGroups.logGroups) {
            Write-Host "   - $($logGroup.logGroupName) (Retention: $($logGroup.retentionInDays) days)" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ No CloudWatch log groups found" -ForegroundColor Red
    }

    # 5. Check IAM Roles
    Write-Host "5. Checking IAM Roles..." -ForegroundColor Yellow
    $roleName = "goalsguild-dev-api-gateway-logs-role"
    $role = aws iam get-role --role-name $roleName --region $Region 2>$null | ConvertFrom-Json
    if ($role -and $role.Role) {
        Write-Host "✅ IAM Role found: $($role.Role.RoleName)" -ForegroundColor Green
    } else {
        Write-Host "❌ IAM Role not found: $roleName" -ForegroundColor Red
    }

    # 6. Check Lambda Functions
    Write-Host "6. Checking Lambda Functions..." -ForegroundColor Yellow
    $lambdaFunctions = @(
        "goalsguild_authorizer_dev",
        "goalsguild_user_service_dev", 
        "goalsguild_quest_service_dev"
    )
    
    foreach ($functionName in $lambdaFunctions) {
        $function = aws lambda get-function --function-name $functionName --region $Region 2>$null | ConvertFrom-Json
        if ($function -and $function.Configuration) {
            Write-Host "✅ Lambda function: $($function.Configuration.FunctionName)" -ForegroundColor Green
        } else {
            Write-Host "❌ Lambda function not found: $functionName" -ForegroundColor Red
        }
    }

    Write-Host "=== Verification Complete ===" -ForegroundColor Green

} catch {
    Write-Host "Error during verification: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
