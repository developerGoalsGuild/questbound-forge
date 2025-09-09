param(
  [ValidateSet('dev','staging','prod')]
  [string]$Env = 'dev',
  [string]$Region,
  [string]$ApiName,
  [switch]$FailOnMissing,
  [switch]$Json
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg)  { Write-Host "$msg" -ForegroundColor Cyan }
function Write-Warn($msg)  { Write-Warning $msg }
function Write-Err($msg)   { Write-Host "$msg" -ForegroundColor Red }

try {
  if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    throw 'AWS CLI not found on PATH. Install and configure credentials.'
  }

  # Resolve default region if not provided
  if (-not $Region -or $Region -eq '') {
    if ($env:AWS_REGION) { $Region = $env:AWS_REGION }
    elseif ($env:AWS_DEFAULT_REGION) { $Region = $env:AWS_DEFAULT_REGION }
    else { $Region = 'us-east-2' }
  }

  # Verify credentials are valid (helps catch ExpiredTokenException early)
  $null = aws sts get-caller-identity --region $Region --output json 2>$null
} catch {
  Write-Err "AWS credentials check failed: $($_.Exception.Message)"
  exit 2
}

if (-not $ApiName) { $ApiName = "goalsguild_api_$Env" }
Write-Info "Checking API Gateway integrations for '$ApiName' in $Region..."

try {
  $apiId = aws apigateway get-rest-apis --region $Region --query "items[?name=='$ApiName'].id | [0]" --output text 2>$null
} catch {
  Write-Err "Failed to query REST APIs: $($_.Exception.Message)"
  exit 3
}

if (-not $apiId -or $apiId -eq 'None') {
  Write-Warn "REST API named '$ApiName' not found in region $Region."
  exit 0
}

# Pull resources with method metadata (up to 500)
try {
  $resJson = aws apigateway get-resources --region $Region --rest-api-id $apiId --embed methods --limit 500 --output json
  $resources = $resJson | ConvertFrom-Json
} catch {
  Write-Err "Failed to list resources: $($_.Exception.Message)"
  exit 4
}

$missing = @()
$checked = 0

foreach ($res in $resources.items) {
  if (-not $res.resourceMethods) { continue }
  $methods = $res.resourceMethods.PSObject.Properties.Name
  foreach ($m in $methods) {
    $checked++
    try {
      $null = aws apigateway get-integration --region $Region --rest-api-id $apiId --resource-id $res.id --http-method $m 2>$null
    } catch {
      # If call fails, consider integration missing
      $missing += [pscustomobject]@{
        ResourcePath = $res.path
        ResourceId   = $res.id
        Method       = $m
      }
    }
  }
}

if ($Json) {
  $out = [pscustomobject]@{
    ApiId         = $apiId
    ApiName       = $ApiName
    Region        = $Region
    Checked       = $checked
    MissingCount  = $missing.Count
    Missing       = $missing
  }
  $out | ConvertTo-Json -Depth 6
} else {
  Write-Host "API: $ApiName ($apiId)  Region: $Region" -ForegroundColor DarkGray
  Write-Host "Checked methods: $checked" -ForegroundColor DarkGray
  if ($missing.Count -eq 0) {
    Write-Host "No missing integrations detected." -ForegroundColor Green
  } else {
    Write-Err "Missing integrations detected: $($missing.Count)"
    $missing | Sort-Object ResourcePath, Method | Format-Table -AutoSize
  }
}

if ($missing.Count -gt 0 -and $FailOnMissing) { exit 10 }
exit 0
