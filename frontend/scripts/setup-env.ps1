# Setup environment variables for development
param(
  [string]$ApiGatewayKey = "f5do7KmhzVaXGqIvGnc2aJMbmm6qQum1FLOXcj4i",
  [string]$ApiGatewayUrl = "https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com",
  [string]$AppSyncEndpoint = "https://f7qjx3q3nfezdnix3wuyxtrnre.appsync-api.us-east-2.amazonaws.com/graphql"
)

$ErrorActionPreference = 'Stop'

# Create .env.development file
$envContent = @"
# API Gateway Configuration
VITE_API_GATEWAY_KEY=$ApiGatewayKey
VITE_API_GATEWAY_URL=$ApiGatewayUrl
VITE_API_BASE_URL=/v1

# AppSync Configuration
VITE_APPSYNC_ENDPOINT=$AppSyncEndpoint
"@

$envFile = Join-Path $PSScriptRoot "..\.env.development"
$envContent | Out-File -FilePath $envFile -Encoding UTF8

Write-Host "Environment file created: $envFile" -ForegroundColor Green
Write-Host "API Gateway Key: $ApiGatewayKey" -ForegroundColor Cyan
Write-Host "API Gateway URL: $ApiGatewayUrl" -ForegroundColor Cyan
Write-Host "AppSync Endpoint: $AppSyncEndpoint" -ForegroundColor Cyan
