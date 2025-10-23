# GoalsGuild Landing Page - S3 Sync Script
# Quick script to sync files to S3 without full deployment

param(
    [Parameter(Mandatory=$true)]
    [string]$S3BucketName,
    
    [Parameter(Mandatory=$false)]
    [string]$SourcePath = "../src",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "${Color}${Message}${Reset}"
}

# Check if source directory exists
if (-not (Test-Path $SourcePath)) {
    Write-ColorOutput "Source directory not found: $SourcePath" $Red
    exit 1
}

Write-ColorOutput "Syncing files to S3 bucket: $S3BucketName" $Yellow

try {
    $SyncArgs = @(
        "s3", "sync", $SourcePath, "s3://$S3BucketName/",
        "--delete",
        "--exclude", "*.git*",
        "--exclude", "*.DS_Store", 
        "--exclude", "Thumbs.db",
        "--cache-control", "max-age=31536000",
        "--metadata-directive", "REPLACE"
    )
    
    if ($DryRun) {
        $SyncArgs += "--dryrun"
        Write-ColorOutput "DRY RUN MODE - No files will be uploaded" $Yellow
    }
    
    # Sync all files
    aws @SyncArgs
    
    # Set specific cache headers for HTML files
    $HtmlArgs = @(
        "s3", "cp", $SourcePath, "s3://$S3BucketName/",
        "--recursive",
        "--exclude", "*",
        "--include", "*.html",
        "--cache-control", "max-age=3600",
        "--metadata-directive", "REPLACE"
    )
    
    if ($DryRun) {
        $HtmlArgs += "--dryrun"
    }
    
    aws @HtmlArgs
    
    if ($DryRun) {
        Write-ColorOutput "Dry run completed. No files were actually uploaded." $Yellow
    } else {
        Write-ColorOutput "Files synced to S3 successfully!" $Green
    }
}
catch {
    Write-ColorOutput "S3 sync failed: $($_.Exception.Message)" $Red
    exit 1
}
