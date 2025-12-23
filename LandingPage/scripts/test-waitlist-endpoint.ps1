# Test Waitlist Endpoint
# This script tests the waitlist subscribe endpoint to verify it's working

$apiBaseUrl = "https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com/v1"
$apiKey = "f5do7KmhzVaXGqIvGnc2aJMbmm6qQum1FLOXcj4i"
$testEmail = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"

Write-Host "Testing Waitlist Endpoint" -ForegroundColor Cyan
Write-Host "API Base URL: $apiBaseUrl" -ForegroundColor Yellow
Write-Host "Test Email: $testEmail" -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        'Content-Type' = 'application/json'
        'x-api-key' = $apiKey
    }
    
    $body = @{
        email = $testEmail
    } | ConvertTo-Json
    
    Write-Host "Sending request..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "$apiBaseUrl/waitlist/subscribe" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "Error occurred!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}














