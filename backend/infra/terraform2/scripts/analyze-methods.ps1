# Analyze API Gateway Methods for Duplicates
$ErrorActionPreference = "Stop"

Write-Host "=== Analyzing API Gateway Methods for Duplicates ===" -ForegroundColor Green

# Read the terraform file
$terraformFile = "..\modules\apigateway\api_gateway.tf"
$content = Get-Content $terraformFile -Raw

# Extract all method resources
$methodPattern = 'resource "aws_api_gateway_method" "([^"]+)" \{[^}]+rest_api_id = ([^\n]+)[^}]+resource_id = ([^\n]+)[^}]+http_method\s*=\s*"([^"]+)"'

$matches = [regex]::Matches($content, $methodPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

Write-Host "Found $($matches.Count) method resources:" -ForegroundColor Yellow
Write-Host ""

$resourceMap = @{}

foreach ($match in $matches) {
    $resourceName = $match.Groups[1].Value
    $restApiId = $match.Groups[2].Value.Trim()
    $resourceId = $match.Groups[3].Value.Trim()
    $httpMethod = $match.Groups[4].Value
    
    # Extract the actual resource reference
    $resourceIdClean = $resourceId -replace 'aws_api_gateway_resource\.', '' -replace '\.id', ''
    
    # Create a unique key for this combination
    $key = "$resourceIdClean|$httpMethod"
    
    if ($resourceMap.ContainsKey($key)) {
        Write-Host "❌ DUPLICATE FOUND:" -ForegroundColor Red
        Write-Host "   Resource: $resourceIdClean" -ForegroundColor Red
        Write-Host "   Method: $httpMethod" -ForegroundColor Red
        Write-Host "   Existing: $($resourceMap[$key])" -ForegroundColor Red
        Write-Host "   Duplicate: $resourceName" -ForegroundColor Red
        Write-Host ""
    } else {
        $resourceMap[$key] = $resourceName
        Write-Host "✅ $resourceName" -ForegroundColor Green
        Write-Host "   Resource: $resourceIdClean, Method: $httpMethod" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Analysis Complete ===" -ForegroundColor Green
Write-Host "Total unique combinations: $($resourceMap.Count)" -ForegroundColor Yellow
