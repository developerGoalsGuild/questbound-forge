# Verify API Gateway and Services
# This script checks if all services are properly integrated with API Gateway

param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Gateway and Services Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get API Gateway info
$apigwPath = Join-Path $PSScriptRoot "..\stacks\apigateway"
Push-Location $apigwPath

try {
    $outputs = terraform output -json 2>&1 | ConvertFrom-Json
    $apiUrl = $outputs.invoke_url.value
    $restApiId = $outputs.rest_api_id.value
    
    # Try to get API key from Terraform output first
    $apiKey = if ($outputs.PSObject.Properties.Name -contains "api_key_value") { $outputs.api_key_value.value } else { "" }
    
    # If not found, try to get from .env.development file
    if (-not $apiKey -or $apiKey -eq "") {
        # Try to find .env.development in common locations
        # Script is in: backend/infra/terraform2/scripts
        # Need to go up 4 levels to project root
        $currentPath = $PSScriptRoot
        for ($i = 0; $i -lt 4; $i++) {
            $currentPath = Split-Path -Parent $currentPath
        }
        $projectRoot = $currentPath
        
        $possiblePaths = @(
            "$projectRoot\frontend\.env.development",
            "$projectRoot\.env.development",
            "$projectRoot\backend\.env.development"
        )
        
        foreach ($envPath in $possiblePaths) {
            if (Test-Path $envPath) {
                $envLines = Get-Content $envPath
                foreach ($line in $envLines) {
                    if ($line -match '^\s*VITE_API_GATEWAY_KEY\s*=\s*(.+)$') {
                        $apiKey = $matches[1].Trim().Trim('"').Trim("'")
                        Write-Host "  Found API key in: $envPath" -ForegroundColor Gray
                        break
                    }
                }
                if ($apiKey) { break }
            }
        }
    }
    
    Write-Host "API Gateway Information:" -ForegroundColor Yellow
    Write-Host "  URL: $apiUrl"
    Write-Host "  REST API ID: $restApiId"
    if ($apiKey -and $apiKey.Length -gt 20) {
        Write-Host "  API Key: $($apiKey.Substring(0, 20))..."
    } else {
        Write-Host "  API Key: $apiKey"
    }
    Write-Host ""
} catch {
    Write-Host "ERROR: Could not get API Gateway outputs" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Pop-Location
    exit 1
}

Pop-Location

# Check service deployments
Write-Host "Service Deployments:" -ForegroundColor Yellow
$servicesPath = Join-Path $PSScriptRoot "..\stacks\services"
$services = @("user-service", "quest-service", "collaboration-service", "guild-service", "messaging-service", "gamification-service")

$serviceStatus = @{}

foreach ($service in $services) {
    $servicePath = Join-Path $servicesPath $service
    if (Test-Path $servicePath) {
        Push-Location $servicePath
        try {
            $output = terraform output -json 2>&1 | ConvertFrom-Json
            if ($output.PSObject.Properties.Name -contains "lambda_function_arn") {
                $lambdaArn = $output.lambda_function_arn.value
                $serviceStatus[$service] = @{
                    Deployed = $true
                    LambdaArn = $lambdaArn
                }
                Write-Host "  [OK] $service : Deployed" -ForegroundColor Green
                $arnShort = if ($lambdaArn.Length -gt 60) { $lambdaArn.Substring(0, 60) + "..." } else { $lambdaArn }
                Write-Host "    ARN: $arnShort" -ForegroundColor Gray
            } else {
                $serviceStatus[$service] = @{ Deployed = $false }
                Write-Host "  [FAIL] $service : No Lambda ARN output" -ForegroundColor Red
            }
        } catch {
            $serviceStatus[$service] = @{ Deployed = $false }
            Write-Host "  [FAIL] $service : Not deployed" -ForegroundColor Red
        }
        Pop-Location
    } else {
        $serviceStatus[$service] = @{ Deployed = $false }
        Write-Host "  [FAIL] $service : Directory not found" -ForegroundColor Red
    }
}

Write-Host ""

# Test API endpoints
Write-Host "Testing API Endpoints:" -ForegroundColor Yellow

$endpoints = @(
    @{ Path = "/health"; Method = "GET"; Auth = $false; Service = "general"; RequiresApiKey = $false },
    @{ Path = "/xp/current"; Method = "GET"; Auth = $true; Service = "gamification"; RequiresApiKey = $true },
    @{ Path = "/badges"; Method = "GET"; Auth = $false; Service = "gamification"; RequiresApiKey = $true },
    @{ Path = "/leaderboard/global"; Method = "GET"; Auth = $false; Service = "gamification"; RequiresApiKey = $true },
    @{ Path = "/challenges"; Method = "GET"; Auth = $false; Service = "gamification"; RequiresApiKey = $true },
    @{ Path = "/quests"; Method = "GET"; Auth = $true; Service = "quest"; RequiresApiKey = $true },
    @{ Path = "/guilds"; Method = "GET"; Auth = $true; Service = "guild"; RequiresApiKey = $true },
    @{ Path = "/profile"; Method = "GET"; Auth = $true; Service = "user"; RequiresApiKey = $true }
)

$results = @()

foreach ($endpoint in $endpoints) {
    $url = "$apiUrl$($endpoint.Path)"
    $headers = @{}
    
    # Always include API key if available and endpoint requires it
    if ($apiKey -and $endpoint.RequiresApiKey) {
        $headers["x-api-key"] = $apiKey
    }
    
    if ($endpoint.Auth) {
        # For authenticated endpoints, we'll just check if they return 401 (expected) or 200
        $headers["Authorization"] = "Bearer test-token"
    }
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method $endpoint.Method -Headers $headers -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $status = $response.StatusCode
        $statusColor = if ($status -eq 200) { "Green" } else { "Yellow" }
        Write-Host "  [OK] $($endpoint.Path) : $status" -ForegroundColor $statusColor
        $results += @{
            Endpoint = $endpoint.Path
            Status = $status
            Service = $endpoint.Service
            Success = $true
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -and $endpoint.Auth) {
            Write-Host "  [OK] $($endpoint.Path) : 401 (Auth required - expected)" -ForegroundColor Green
            $results += @{
                Endpoint = $endpoint.Path
                Status = 401
                Service = $endpoint.Service
                Success = $true
            }
        } elseif ($statusCode -eq 403) {
            Write-Host "  [WARN] $($endpoint.Path) : 403 (Forbidden - may need auth)" -ForegroundColor Yellow
            $results += @{
                Endpoint = $endpoint.Path
                Status = 403
                Service = $endpoint.Service
                Success = $false
            }
        } elseif ($statusCode -eq 404) {
            Write-Host "  [FAIL] $($endpoint.Path) : 404 (Not found)" -ForegroundColor Red
            $results += @{
                Endpoint = $endpoint.Path
                Status = 404
                Service = $endpoint.Service
                Success = $false
            }
        } else {
            Write-Host "  [FAIL] $($endpoint.Path) : Error - $($_.Exception.Message)" -ForegroundColor Red
            $results += @{
                Endpoint = $endpoint.Path
                Status = "Error"
                Service = $endpoint.Service
                Success = $false
            }
        }
    }
}

Write-Host ""

# Summary
Write-Host "Summary:" -ForegroundColor Yellow
$successCount = ($results | Where-Object { $_.Success }).Count
$totalCount = $results.Count
Write-Host "  Endpoints tested: $totalCount"
Write-Host "  Successful: $successCount" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })
Write-Host "  Failed: $($totalCount - $successCount)" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Red" })

Write-Host ""
Write-Host "Service Status:" -ForegroundColor Yellow
foreach ($service in $services) {
    $status = $serviceStatus[$service]
    $endpointsForService = $results | Where-Object { $_.Service -eq $service.Replace("-service", "") }
    $serviceSuccess = ($endpointsForService | Where-Object { $_.Success }).Count
    
    if ($status.Deployed) {
        Write-Host "  [OK] $service : Deployed" -ForegroundColor Green
        if ($endpointsForService) {
            $color = if ($serviceSuccess -eq $endpointsForService.Count) { "Green" } else { "Yellow" }
            Write-Host "    Endpoints: $serviceSuccess/$($endpointsForService.Count) working" -ForegroundColor $color
        }
    } else {
        Write-Host "  [FAIL] $service : Not deployed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

