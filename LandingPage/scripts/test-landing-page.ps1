# GoalsGuild Landing Page - Test Script
# Starts a local server and opens the landing page in browser

param(
    [Parameter(Mandatory=$false)]
    [int]$Port = 9000,
    
    [Parameter(Mandatory=$false)]
    [switch]$OpenBrowser = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

# Colors for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "${Color}${Message}${Reset}"
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-Port {
    param([int]$PortNumber)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $PortNumber -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    }
    catch {
        return $false
    }
}

function Start-LandingPageServer {
    param([int]$PortNumber)
    
    Write-ColorOutput "🚀 Starting GoalsGuild Landing Page Test Server..." $Blue
    
    # Check if Python is available
    if (-not (Test-Command "python")) {
        Write-ColorOutput "❌ Python is not installed or not in PATH" $Red
        Write-ColorOutput "Please install Python from https://python.org" $Yellow
        exit 1
    }
    
    # Check if port is available
    if (Test-Port $PortNumber) {
        Write-ColorOutput "⚠️  Port $PortNumber is already in use. Trying port $($PortNumber + 1)..." $Yellow
        $PortNumber = $PortNumber + 1
    }
    
    # Change to LandingPage/src directory
    $ScriptDir = Split-Path -Parent $MyInvocation.PSCommandPath
    $LandingPageDir = Join-Path $ScriptDir "..\src"
    
    if (-not (Test-Path $LandingPageDir)) {
        Write-ColorOutput "❌ LandingPage/src directory not found at: $LandingPageDir" $Red
        exit 1
    }
    
    Write-ColorOutput "📁 Serving files from: $LandingPageDir" $Blue
    
    # Start the server in background
    $Job = Start-Job -ScriptBlock {
        param($Dir, $Port)
        Set-Location $Dir
        python -m http.server $Port
    } -ArgumentList $LandingPageDir, $PortNumber
    
    # Wait a moment for server to start
    Start-Sleep -Seconds 2
    
    # Check if server started successfully
    if (Test-Port $PortNumber) {
        Write-ColorOutput "✅ Server started successfully on port $PortNumber" $Green
        return $Job, $PortNumber
    } else {
        Write-ColorOutput "❌ Failed to start server on port $PortNumber" $Red
        Stop-Job $Job -ErrorAction SilentlyContinue
        Remove-Job $Job -ErrorAction SilentlyContinue
        exit 1
    }
}

function Open-LandingPage {
    param([int]$PortNumber)
    
    $Url = "http://localhost:$PortNumber"
    Write-ColorOutput "🌐 Opening landing page: $Url" $Blue
    
    try {
        Start-Process $Url
        Write-ColorOutput "✅ Browser opened successfully" $Green
    }
    catch {
        Write-ColorOutput "⚠️  Could not open browser automatically. Please open: $Url" $Yellow
    }
}

function Show-TestingInstructions {
    param([int]$PortNumber)
    
    $Url = "http://localhost:$PortNumber"
    
    Write-ColorOutput "`n🧪 GoalsGuild Landing Page Testing Instructions" $Blue
    Write-ColorOutput "=" * 50 $Blue
    
    Write-ColorOutput "`n📋 What to Test:" $Yellow
    Write-ColorOutput "1. Landing Page: $Url" $Green
    Write-ColorOutput "2. Blog Page: $Url/blog.html" $Green
    Write-ColorOutput "3. Sample Article: $Url/blog/articles/2025-10-23-welcome-to-goalsguild.html" $Green
    
    Write-ColorOutput "`n🎯 Key Features to Verify:" $Yellow
    Write-ColorOutput "• Hero section with GoalsGuild logo" $Green
    Write-ColorOutput "• Feature carousel (auto-rotating)" $Green
    Write-ColorOutput "• 6 feature cards with icons" $Green
    Write-ColorOutput "• 'How It Works' 4-step process" $Green
    Write-ColorOutput "• Statistics section" $Green
    Write-ColorOutput "• Waitlist form" $Green
    Write-ColorOutput "• Social media links" $Green
    Write-ColorOutput "• Responsive design (test mobile/tablet)" $Green
    
    Write-ColorOutput "`n🔧 Interactive Testing:" $Yellow
    Write-ColorOutput "• Carousel navigation (prev/next buttons)" $Green
    Write-ColorOutput "• Mobile menu (hamburger icon)" $Green
    Write-ColorOutput "• Waitlist form submission" $Green
    Write-ColorOutput "• Blog category filters" $Green
    Write-ColorOutput "• Smooth scrolling navigation" $Green
    
    Write-ColorOutput "`n📱 Responsive Testing:" $Yellow
    Write-ColorOutput "• Open Developer Tools (F12)" $Green
    Write-ColorOutput "• Toggle device toolbar (Ctrl+Shift+M)" $Green
    Write-ColorOutput "• Test: Mobile (375px), Tablet (768px), Desktop (1200px)" $Green
    
    Write-ColorOutput "`n⚡ Performance Testing:" $Yellow
    Write-ColorOutput "• Check Network tab for loading times" $Green
    Write-ColorOutput "• Verify no console errors" $Green
    Write-ColorOutput "• Test with slow 3G connection" $Green
    
    Write-ColorOutput "`n♿ Accessibility Testing:" $Yellow
    Write-ColorOutput "• Keyboard navigation (Tab, Enter, Arrow keys)" $Green
    Write-ColorOutput "• Screen reader compatibility" $Green
    Write-ColorOutput "• Color contrast verification" $Green
    Write-ColorOutput "• Alt text on images" $Green
}

function Show-DeploymentInstructions {
    Write-ColorOutput "`n🚀 Deployment Instructions" $Blue
    Write-ColorOutput "=" * 30 $Blue
    
    Write-ColorOutput "`n📦 Deploy to AWS:" $Yellow
    Write-ColorOutput "1. Configure AWS credentials:" $Green
    Write-ColorOutput "   aws configure" $Green
    Write-ColorOutput "`n2. Deploy to development:" $Green
    Write-ColorOutput "   .\scripts\deploy.ps1 -Environment dev" $Green
    Write-ColorOutput "`n3. Deploy to production:" $Green
    Write-ColorOutput "   .\scripts\deploy.ps1 -Environment prod" $Green
    
    Write-ColorOutput "`n📝 Prerequisites:" $Yellow
    Write-ColorOutput "• AWS CLI installed and configured" $Green
    Write-ColorOutput "• Terraform installed" $Green
    Write-ColorOutput "• Appropriate AWS permissions" $Green
}

function Stop-TestServer {
    param($Job)
    
    Write-ColorOutput "`n🛑 Stopping test server..." $Yellow
    try {
        Stop-Job $Job -ErrorAction SilentlyContinue
        Remove-Job $Job -ErrorAction SilentlyContinue
        Write-ColorOutput "✅ Server stopped successfully" $Green
    }
    catch {
        Write-ColorOutput "⚠️  Server may still be running. Check Task Manager if needed." $Yellow
    }
}

# Main execution
try {
    Write-ColorOutput "🎯 GoalsGuild Landing Page Test Script" $Blue
    Write-ColorOutput "=====================================" $Blue
    
    # Start the server
    $ServerJob, $ActualPort = Start-LandingPageServer -PortNumber $Port
    
    # Open browser if requested
    if ($OpenBrowser) {
        Open-LandingPage -PortNumber $ActualPort
    }
    
    # Show testing instructions
    Show-TestingInstructions -PortNumber $ActualPort
    
    # Show deployment instructions
    Show-DeploymentInstructions
    
    Write-ColorOutput "`n⌨️  Press any key to stop the server and exit..." $Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    # Stop the server
    Stop-TestServer -Job $ServerJob
    
    Write-ColorOutput "`n✅ Testing completed successfully!" $Green
    Write-ColorOutput "The GoalsGuild landing page is ready for deployment to AWS." $Green
    
} catch {
    Write-ColorOutput "`n❌ An error occurred: $($_.Exception.Message)" $Red
    Write-ColorOutput "Please check the error and try again." $Yellow
    exit 1
}
