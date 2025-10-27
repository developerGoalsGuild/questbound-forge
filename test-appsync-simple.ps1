$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGgubG9jYWwiLCJhdWQiOiJhcGk6Ly9kZWZhdWx0Iiwic3ViIjoiYjhlNTNhYzQtMTY0OS00Y2U5LTg3MjUtYTBlNWU1NmQ4NTI3IiwiZW1haWwiOiJhbmRyZXNfYWx2YXJAaG90bWFpbC5jb20iLCJzY29wZSI6InVzZXI6cmVhZCIsImlhdCI6MTc2MTU2MzUzMywibmJmIjoxNzYxNTYzNTMzLCJleHAiOjE3NjE1NjcxMzMsInRva2VuX3VzZSI6ImFjY2VzcyIsInByb3ZpZGVyIjoibG9jYWwiLCJyb2xlIjoidXNlciIsIm5pY2tuYW1lIjoicGlydWxhcyJ9.1G35PL5JLH9ti54meBy8eGfdEklGXwn0AlkZnyMv0Kg"
$endpoint = "https://f7qjx3q3nfezdnix3wuyxtrnre.appsync-api.us-east-2.amazonaws.com/graphql"

$body = @'
{
  "query": "query GetMessages($roomId: ID!, $limit: Int) { messages(roomId: $roomId, limit: $limit) { id roomId senderId text ts } }",
  "variables": {
    "roomId": "ROOM-general",
    "limit": 20
  }
}
'@

Write-Host "Testing AppSync with Bearer token..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $endpoint -Method Post -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    } -Body $body

    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}

