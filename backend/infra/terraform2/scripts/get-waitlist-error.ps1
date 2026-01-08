# Get waitlist error from CloudWatch logs

Write-Host "=== Getting Waitlist Error Logs ===" -ForegroundColor Cyan

# Try different possible function names
$possibleNames = @(
    "goalsguild_user_service_dev",
    "goalsguild-user-service-dev",
    "user-service-dev",
    "user_service_dev"
)

$foundFunction = $null
foreach ($name in $possibleNames) {
    $logGroup = "/aws/lambda/$name"
    Write-Host "Checking: $logGroup" -ForegroundColor Yellow
    $exists = aws logs describe-log-groups --log-group-name-prefix $logGroup --query "logGroups[0].logGroupName" --output text 2>&1
    if ($exists -and $exists -ne "None") {
        $foundFunction = $name
        Write-Host "Found: $name" -ForegroundColor Green
        break
    }
}

if (-not $foundFunction) {
    Write-Host "`nListing all Lambda functions..." -ForegroundColor Yellow
    aws lambda list-functions --query "Functions[*].FunctionName" --output table 2>&1
    Write-Host "`nPlease provide the correct function name" -ForegroundColor Red
    exit 1
}

$logGroup = "/aws/lambda/$foundFunction"
Write-Host "`nUsing log group: $logGroup" -ForegroundColor Green

# Get latest log stream
Write-Host "`nGetting latest log stream..." -ForegroundColor Yellow
$streams = aws logs describe-log-streams `
    --log-group-name $logGroup `
    --order-by LastEventTime `
    --descending `
    --max-items 5 `
    --query "logStreams[*].logStreamName" `
    --output text 2>&1

if ($streams) {
    $streamArray = $streams -split "`t"
    Write-Host "Found $($streamArray.Count) recent streams" -ForegroundColor Green
    
    foreach ($stream in $streamArray[0..2]) {
        if ($stream -and $stream -ne "None") {
            Write-Host "`n=== Stream: $stream ===" -ForegroundColor Cyan
            $events = aws logs get-log-events `
                --log-group-name $logGroup `
                --log-stream-name $stream `
                --limit 100 `
                --query "events[*].message" `
                --output text 2>&1
            
            if ($events) {
                $eventArray = $events -split "`t"
                $relevant = $eventArray | Where-Object { $_ -match "waitlist|ERROR|Exception|Traceback|500" }
                if ($relevant) {
                    $relevant | ForEach-Object {
                        if ($_ -match "ERROR|Exception|Traceback") {
                            Write-Host $_ -ForegroundColor Red
                        } elseif ($_ -match "waitlist") {
                            Write-Host $_ -ForegroundColor Yellow
                        } else {
                            Write-Host $_ -ForegroundColor White
                        }
                    }
                } else {
                    Write-Host "No relevant events in this stream" -ForegroundColor Gray
                }
            }
        }
    }
} else {
    Write-Host "No log streams found" -ForegroundColor Yellow
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan















