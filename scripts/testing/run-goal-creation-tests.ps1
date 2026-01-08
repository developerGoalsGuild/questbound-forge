# Goal Creation Form Test Runner
# Runs unit, integration, and E2E tests for the Goal Creation Form feature

param(
    [string]$TestType = "all",  # all, unit, integration, e2e
    [string]$Environment = "dev",  # dev, staging, prod
    [switch]$Headless = $true,
    [switch]$Verbose = $false,
    [switch]$Coverage = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$BaseUrl = switch ($Environment) {
    "dev" { "http://localhost:8080" }
    "staging" { "https://staging.goalsguild.com" }
    "prod" { "https://goalsguild.com" }
    default { "http://localhost:8080" }
}

$SeleniumGridUrl = "http://localhost:4444/wd/hub"
$TestUserEmail = $env:TEST_USER_EMAIL
$TestUserPassword = $env:TEST_USER_PASSWORD

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-TestHeader {
    param([string]$Title)
    Write-ColorOutput "`n" + "="*60 -Color Cyan
    Write-ColorOutput " $Title" -Color Cyan
    Write-ColorOutput "="*60 -Color Cyan
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Details = ""
    )
    $status = if ($Success) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($Success) { "Green" } else { "Red" }
    
    Write-ColorOutput "  $status $TestName" -Color $color
    if ($Details) {
        Write-ColorOutput "    $Details" -Color Gray
    }
}

# Check prerequisites
function Test-Prerequisites {
    Write-TestHeader "Checking Prerequisites"
    
    $prereqs = @()
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-TestResult "Node.js" $true "Version: $nodeVersion"
        } else {
            Write-TestResult "Node.js" $false "Not installed"
            $prereqs += "Node.js"
        }
    } catch {
        Write-TestResult "Node.js" $false "Not installed"
        $prereqs += "Node.js"
    }
    
    # Check if npm is available
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-TestResult "npm" $true "Version: $npmVersion"
        } else {
            Write-TestResult "npm" $false "Not available"
            $prereqs += "npm"
        }
    } catch {
        Write-TestResult "npm" $false "Not available"
        $prereqs += "npm"
    }
    
    # Check if frontend dependencies are installed
    if (Test-Path "apps/frontend/node_modules") {
        Write-TestResult "Frontend Dependencies" $true "node_modules found"
    } else {
        Write-TestResult "Frontend Dependencies" $false "Run 'npm install' in apps/frontend directory"
        $prereqs += "Frontend dependencies"
    }
    
    # Check environment variables for E2E tests
    if ($TestType -eq "all" -or $TestType -eq "e2e") {
        if ($TestUserEmail -and $TestUserPassword) {
            Write-TestResult "E2E Test Credentials" $true "Environment variables set"
        } else {
            Write-TestResult "E2E Test Credentials" $false "Set TEST_USER_EMAIL and TEST_USER_PASSWORD"
            $prereqs += "E2E test credentials"
        }
    }
    
    if ($prereqs.Count -gt 0) {
        Write-ColorOutput "`nMissing prerequisites: $($prereqs -join ', ')" -Color Red
        Write-ColorOutput "Please install missing prerequisites and try again." -Color Red
        exit 1
    }
    
    Write-ColorOutput "`nAll prerequisites met!" -Color Green
}

# Run unit tests
function Invoke-UnitTests {
    Write-TestHeader "Running Unit Tests"
    
    $testArgs = @("test", "--testPathPattern=GoalCreationForm")
    
    if ($Coverage) {
        $testArgs += "--coverage"
    }
    
    if ($Verbose) {
        $testArgs += "--verbose"
    }
    
    try {
        Set-Location "apps/frontend"
        $output = npm $testArgs 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-TestResult "Unit Tests" $true "All tests passed"
            if ($Verbose) {
                Write-ColorOutput $output -Color Gray
            }
        } else {
            Write-TestResult "Unit Tests" $false "Some tests failed"
            Write-ColorOutput $output -Color Red
        }
        
        return $exitCode -eq 0
    } catch {
        Write-TestResult "Unit Tests" $false "Failed to run tests: $($_.Exception.Message)"
        return $false
    } finally {
        Set-Location ".."
    }
}

# Run integration tests
function Invoke-IntegrationTests {
    Write-TestHeader "Running Integration Tests"
    
    $testArgs = @("test", "--testPathPattern=integration")
    
    if ($Coverage) {
        $testArgs += "--coverage"
    }
    
    if ($Verbose) {
        $testArgs += "--verbose"
    }
    
    try {
        Set-Location "apps/frontend"
        $output = npm $testArgs 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-TestResult "Integration Tests" $true "All tests passed"
            if ($Verbose) {
                Write-ColorOutput $output -Color Gray
            }
        } else {
            Write-TestResult "Integration Tests" $false "Some tests failed"
            Write-ColorOutput $output -Color Red
        }
        
        return $exitCode -eq 0
    } catch {
        Write-TestResult "Integration Tests" $false "Failed to run tests: $($_.Exception.Message)"
        return $false
    } finally {
        Set-Location ".."
    }
}

# Run E2E tests
function Invoke-E2ETests {
    Write-TestHeader "Running E2E Tests"
    
    # Check if Selenium Grid is running
    try {
        $response = Invoke-WebRequest -Uri "$SeleniumGridUrl/status" -TimeoutSec 5 -ErrorAction Stop
        Write-TestResult "Selenium Grid" $true "Grid is running"
    } catch {
        Write-TestResult "Selenium Grid" $false "Grid not accessible at $SeleniumGridUrl"
        Write-ColorOutput "Please start Selenium Grid before running E2E tests" -Color Yellow
        return $false
    }
    
    # Check if application is running
    try {
        $response = Invoke-WebRequest -Uri $BaseUrl -TimeoutSec 5 -ErrorAction Stop
        Write-TestResult "Application" $true "Application is running at $BaseUrl"
    } catch {
        Write-TestResult "Application" $false "Application not accessible at $BaseUrl"
        Write-ColorOutput "Please start the application before running E2E tests" -Color Yellow
        return $false
    }
    
    # Run E2E tests
    try {
        $env:BASE_URL = $BaseUrl
        $env:SELENIUM_GRID_URL = $SeleniumGridUrl
        
        Set-Location "tests/integration"
        $output = node goalCreationTest.js 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-TestResult "E2E Tests" $true "All tests passed"
            if ($Verbose) {
                Write-ColorOutput $output -Color Gray
            }
        } else {
            Write-TestResult "E2E Tests" $false "Some tests failed"
            Write-ColorOutput $output -Color Red
        }
        
        return $exitCode -eq 0
    } catch {
        Write-TestResult "E2E Tests" $false "Failed to run tests: $($_.Exception.Message)"
        return $false
    } finally {
        Set-Location "../.."
    }
}

# Run accessibility tests
function Invoke-AccessibilityTests {
    Write-TestHeader "Running Accessibility Tests"
    
    try {
        Set-Location "apps/frontend"
        
        # Check if axe-core is available
        $axeInstalled = npm list @axe-core/cli 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-TestResult "Axe CLI" $false "Not installed. Run 'npm install -g @axe-core/cli'"
            return $false
        }
        
        # Run accessibility tests
        $output = npx @axe-core/cli $BaseUrl 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-TestResult "Accessibility Tests" $true "No accessibility violations found"
            if ($Verbose) {
                Write-ColorOutput $output -Color Gray
            }
        } else {
            Write-TestResult "Accessibility Tests" $false "Accessibility violations found"
            Write-ColorOutput $output -Color Red
        }
        
        return $exitCode -eq 0
    } catch {
        Write-TestResult "Accessibility Tests" $false "Failed to run tests: $($_.Exception.Message)"
        return $false
    } finally {
        Set-Location ".."
    }
}

# Generate test report
function New-TestReport {
    param(
        [hashtable]$Results
    )
    
    Write-TestHeader "Test Summary"
    
    $totalTests = $Results.Count
    $passedTests = ($Results.Values | Where-Object { $_ -eq $true }).Count
    $failedTests = $totalTests - $passedTests
    
    Write-ColorOutput "Total Tests: $totalTests" -Color White
    Write-ColorOutput "Passed: $passedTests" -Color Green
    Write-ColorOutput "Failed: $failedTests" -Color Red
    
    $successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }
    Write-ColorOutput "Success Rate: $successRate%" -Color $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
    
    if ($failedTests -gt 0) {
        Write-ColorOutput "`nFailed Tests:" -Color Red
        foreach ($test in $Results.GetEnumerator()) {
            if ($test.Value -eq $false) {
                Write-ColorOutput "  - $($test.Key)" -Color Red
            }
        }
    }
    
    return $successRate -ge 80
}

# Main execution
function Start-TestSuite {
    Write-ColorOutput "Goal Creation Form Test Suite" -Color Cyan
    Write-ColorOutput "=============================" -Color Cyan
    Write-ColorOutput "Test Type: $TestType" -Color White
    Write-ColorOutput "Environment: $Environment" -Color White
    Write-ColorOutput "Base URL: $BaseUrl" -Color White
    Write-ColorOutput "Headless: $Headless" -Color White
    Write-ColorOutput "Verbose: $Verbose" -Color White
    Write-ColorOutput "Coverage: $Coverage" -Color White
    
    # Check prerequisites
    Test-Prerequisites
    
    $results = @{}
    
    # Run tests based on type
    if ($TestType -eq "all" -or $TestType -eq "unit") {
        $results["Unit Tests"] = Invoke-UnitTests
    }
    
    if ($TestType -eq "all" -or $TestType -eq "integration") {
        $results["Integration Tests"] = Invoke-IntegrationTests
    }
    
    if ($TestType -eq "all" -or $TestType -eq "e2e") {
        $results["E2E Tests"] = Invoke-E2ETests
    }
    
    if ($TestType -eq "all") {
        $results["Accessibility Tests"] = Invoke-AccessibilityTests
    }
    
    # Generate report
    $overallSuccess = New-TestReport -Results $results
    
    if ($overallSuccess) {
        Write-ColorOutput "`n🎉 All tests completed successfully!" -Color Green
        exit 0
    } else {
        Write-ColorOutput "`n❌ Some tests failed. Please review the output above." -Color Red
        exit 1
    }
}

# Run the test suite
Start-TestSuite
