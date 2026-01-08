# Check CloudWatch logs for waitlist errors

$ErrorActionPreference = "Continue"

Write-Host "=== Checking Waitlist Logs ===" -ForegroundColor Cyan

# Find the Lambda function
Write-Host "`nFinding Lambda function..." -ForegroundColor Yellow
$functions = aws lambda list-functions --query "Functions[?contains(FunctionName, 'user_service') || contains(FunctionName, 'user-service')].FunctionName" --output text 2>&1

if (-not $functions) {
    Write-Host "No user-service Lambda function found" -ForegroundColor Red
    Write-Host "Trying to find any Lambda with 'user' in name..." -ForegroundColor Yellow
    $functions = aws lambda list-functions --query "Functions[?contains(FunctionName, 'user')].FunctionName" --output text 2>&1
}

if ($functions) {
    $funcName = $functions.Split("`t")[0]
    Write-Host "Found function: $funcName" -ForegroundColor Green
    
    $logGroup = "/aws/lambda/$funcName"
    Write-Host "Log group: $logGroup" -ForegroundColor Gray
    
    # Get latest log stream
    Write-Host "`nGetting latest log stream..." -ForegroundColor Yellow
    $stream = aws logs describe-log-streams `
        --log-group-name $logGroup `
        --order-by LastEventTime `
        --descending `
        --max-items 1 `
        --query "logStreams[0].logStreamName" `
        --output text 2>&1
    
    if ($stream -and $stream -ne "None") {
        Write-Host "Latest stream: $stream" -ForegroundColor Green
        
        Write-Host "`n=== Recent Logs (Last 50 events) ===" -ForegroundColor Cyan
        $events = aws logs get-log-events `
            --log-group-name $logGroup `
            --log-stream-name $stream `
            --limit 50 `
            --query "events[*].[timestamp,message]" `
            --output text 2>&1
        
        if ($events) {
            $events | ForEach-Object {
                $parts = $_ -split "`t", 2
                if ($parts.Length -eq 2) {
                    $timestamp = [DateTimeOffset]::FromUnixTimeMilliseconds([int64]$parts[0]).LocalDateTime
                    $message = $parts[1]
                    
                    if ($message -match "waitlist|ERROR|Exception|Traceback") {
                        Write-Host "[$timestamp] " -ForegroundColor Yellow -NoNewline
                        Write-Host $message -ForegroundColor $(if ($message -match "ERROR|Exception|Traceback") { "Red" } else { "White" })
                    }
                }
            }
        } else {
            Write-Host "No events found in stream" -ForegroundColor Yellow
        }
        
        # Filter for waitlist errors
        Write-Host "`n=== Waitlist Errors ===" -ForegroundColor Cyan
        $waitlistEvents = aws logs filter-log-events `
            --log-group-name $logGroup `
            --start-time $([int64]((Get-Date).AddMinutes(-10).ToUniversalTime() - (Get-Date "1970-01-01")).TotalSeconds)000 `
            --filter-pattern "waitlist" `
            --query "events[*].message" `
            --output text 2>&1
        
        if ($waitlistEvents) {
            $waitlistEvents -split "`t" | ForEach-Object { Write-Host $_ -ForegroundColor $(if ($_ -match "ERROR|error|Exception") { "Red" } else { "White" }) }
        } else {
            Write-Host "No waitlist events found in last 10 minutes" -ForegroundColor Yellow
        }
        
        # Filter for errors
        Write-Host "`n=== All Errors (Last 10 minutes) ===" -ForegroundColor Cyan
        $errorEvents = aws logs filter-log-events `
            --log-group-name $logGroup `
            --start-time $([int64]((Get-Date).AddMinutes(-10).ToUniversalTime() - (Get-Date "1970-01-01")).TotalSeconds)000 `
            --filter-pattern "ERROR" `
            --query "events[*].message" `
            --output text 2>&1
        
        if ($errorEvents) {
            $errorEvents -split "`t" | Select-Object -Last 20 | ForEach-Object { 
                Write-Host $_ -ForegroundColor Red 
            }
        } else {
            Write-Host "No ERROR events found in last 10 minutes" -ForegroundColor Yellow
        }
    } else {
        Write-Host "No log streams found" -ForegroundColor Yellow
    }
} else {
    Write-Host "Could not find Lambda function" -ForegroundColor Red
    Write-Host "Available functions:" -ForegroundColor Yellow
    aws lambda list-functions --query "Functions[*].FunctionName" --output table 2>&1
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan















