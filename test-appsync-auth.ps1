#!/usr/bin/env pwsh
# Test AppSync GraphQL Authentication

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGgubG9jYWwiLCJhdWQiOiJhcGk6Ly9kZWZhdWx0Iiwic3ViIjoiYjhlNTNhYzQtMTY0OS00Y2U5LTg3MjUtYTBlNWU1NmQ4NTI3IiwiZW1haWwiOiJhbmRyZXNfYWx2YXJAaG90bWFpbC5jb20iLCJzY29wZSI6InVzZXI6cmVhZCIsImlhdCI6MTc2MTU2MzUzMywibmJmIjoxNzYxNTYzNTMzLCJleHAiOjE3NjE1NjcxMzMsInRva2VuX3VzZSI6ImFjY2VzcyIsInByb3ZpZGVyIjoibG9jYWwiLCJyb2xlIjoidXNlciIsIm5pY2tuYW1lIjoicGlydWxhcyJ9.1G35PL5JLH9ti54meBy8eGfdEklGXwn0AlkZnyMv0Kg"
$endpoint = "https://f7qjx3q3nfezdnix3wuyxtrnre.appsync-api.us-east-2.amazonaws.com/graphql"
$apiKey = "da2-vey6tzb3ynadbbcqnceaktdt4q"

# Test query
$query = @{
    query = @"
query GetMessages(`$roomId: ID!, `$after: AWSTimestamp, `$limit: Int) {
    messages(roomId: `$roomId, after: `$after, limit: `$limit) {
        id
        roomId
        senderId
        text
        ts
    }
}
"@
    variables = @{
        roomId = "ROOM-general"
        limit = 20
    }
} | ConvertTo-Json -Depth 10

Write-Host "🚀 Testing AppSync GraphQL with fresh token..." -ForegroundColor Cyan
Write-Host "Token expires at: $(Get-Date -UnixTimeSeconds 1761567133)" -ForegroundColor Yellow
Write-Host ""

# Test with Lambda authorizer (Bearer token)
Write-Host "📡 Testing with Lambda Authorizer (Bearer token)..." -ForegroundColor Green
$response1 = Invoke-RestMethod -Uri $endpoint -Method Post -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
} -Body $query -ErrorAction SilentlyContinue

if ($response1.errors) {
    Write-Host "❌ Lambda Auth Failed:" -ForegroundColor Red
    $response1.errors | ForEach-Object {
        Write-Host "   Error: $($_.message)" -ForegroundColor Red
        Write-Host "   Type: $($_.errorType)" -ForegroundColor Red
    }
} else {
    Write-Host "✅ Lambda Auth Success!" -ForegroundColor Green
    Write-Host "   Messages returned: $($response1.data.messages.Count)" -ForegroundColor Green
}

Write-Host ""

# Test with API Key (fallback)
Write-Host "📡 Testing with API Key (fallback)..." -ForegroundColor Green
$response2 = Invoke-RestMethod -Uri $endpoint -Method Post -Headers @{
    "Content-Type" = "application/json"
    "x-api-key" = $apiKey
} -Body $query -ErrorAction SilentlyContinue

if ($response2.errors) {
    Write-Host "❌ API Key Auth Failed:" -ForegroundColor Red
    $response2.errors | ForEach-Object {
        Write-Host "   Error: $($_.message)" -ForegroundColor Red
        Write-Host "   Type: $($_.errorType)" -ForegroundColor Red
    }
} else {
    Write-Host "✅ API Key Auth Success!" -ForegroundColor Green
    Write-Host "   Messages returned: $($response2.data.messages.Count)" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Test complete!" -ForegroundColor Cyan

