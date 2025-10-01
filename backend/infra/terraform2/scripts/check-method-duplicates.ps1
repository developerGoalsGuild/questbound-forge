# Check for duplicate API Gateway Methods
$ErrorActionPreference = "Stop"

Write-Host "=== Checking for Duplicate API Gateway Methods ===" -ForegroundColor Green

# Read the terraform file
$terraformFile = "..\modules\apigateway\api_gateway.tf"
$content = Get-Content $terraformFile -Raw

# Split by resource blocks
$resourceBlocks = $content -split 'resource "aws_api_gateway_method"'

$methods = @()

foreach ($block in $resourceBlocks) {
    if ($block -match '"([^"]+)" \{[^}]+resource_id\s*=\s*aws_api_gateway_resource\.([^\.]+)\.id[^}]+http_method\s*=\s*"([^"]+)"') {
        $methodName = $matches[1]
        $resourceId = $matches[2]
        $httpMethod = $matches[3]
        
        $methods += [PSCustomObject]@{
            Name = $methodName
            ResourceId = $resourceId
            HttpMethod = $httpMethod
            Key = "$resourceId|$httpMethod"
        }
    }
}

Write-Host "Found $($methods.Count) method resources:" -ForegroundColor Yellow
Write-Host ""

# Group by key to find duplicates
$groupedMethods = $methods | Group-Object Key

foreach ($group in $groupedMethods) {
    if ($group.Count -gt 1) {
        Write-Host "❌ DUPLICATE FOUND:" -ForegroundColor Red
        Write-Host "   Key: $($group.Name)" -ForegroundColor Red
        Write-Host "   Methods:" -ForegroundColor Red
        foreach ($method in $group.Group) {
            Write-Host "     - $($method.Name) ($($method.ResourceId) - $($method.HttpMethod))" -ForegroundColor Red
        }
        Write-Host ""
    } else {
        $method = $group.Group[0]
        Write-Host "✅ $($method.Name)" -ForegroundColor Green
        Write-Host "   Resource: $($method.ResourceId), Method: $($method.HttpMethod)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Analysis Complete ===" -ForegroundColor Green
Write-Host "Total unique combinations: $($groupedMethods.Count)" -ForegroundColor Yellow
