# User Header Integration Tests
# Tests header functionality across authenticated pages

param(
    [string]$BaseUrl = "http://localhost:5173",
    [string]$Browser = "chrome",
    [switch]$Headless = $true,
    [switch]$Verbose = $false
)

Write-Host "Starting User Header Integration Tests..." -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host "Browser: $Browser" -ForegroundColor Yellow
Write-Host "Headless: $Headless" -ForegroundColor Yellow

# Set environment variables
$env:TEST_BASE_URL = $BaseUrl
$env:NODE_ENV = "test"

# Check if Node.js and npm are available
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Error "Node.js or npm not found. Please install Node.js to run tests."
    exit 1
}

# Check if selenium-webdriver is installed
try {
    $seleniumInstalled = npm list selenium-webdriver --depth=0 2>$null
    if (-not $seleniumInstalled) {
        Write-Host "Installing selenium-webdriver..." -ForegroundColor Yellow
        npm install selenium-webdriver
    }
} catch {
    Write-Error "Failed to install selenium-webdriver. Please run 'npm install selenium-webdriver' manually."
    exit 1
}

# Check if mocha and chai are installed
try {
    $mochaInstalled = npm list mocha --depth=0 2>$null
    $chaiInstalled = npm list chai --depth=0 2>$null
    if (-not $mochaInstalled -or -not $chaiInstalled) {
        Write-Host "Installing test dependencies..." -ForegroundColor Yellow
        npm install --save-dev mocha chai
    }
} catch {
    Write-Error "Failed to install test dependencies. Please run 'npm install --save-dev mocha chai' manually."
    exit 1
}

# Test 1: Header Display on Dashboard
Write-Host "`nTest 1: Verifying header display on dashboard..." -ForegroundColor Yellow
try {
    $test1Result = node -e "
        const { Builder, By, until } = require('selenium-webdriver');
        const chrome = require('selenium-webdriver/chrome');
        
        async function testHeaderDisplay() {
            const options = new chrome.Options();
            if ('$Headless' -eq 'True') {
                options.addArguments('--headless');
            }
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            
            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
            
            try {
                await driver.get('$BaseUrl/dashboard');
                await driver.wait(until.elementLocated(By.css('[data-testid=\"user-header\"]')), 10000);
                
                const header = await driver.findElement(By.css('[data-testid=\"user-header\"]'));
                const isDisplayed = await header.isDisplayed();
                
                console.log('Header display test:', isDisplayed ? 'PASSED' : 'FAILED');
                return isDisplayed;
            } finally {
                await driver.quit();
            }
        }
        
        testHeaderDisplay().catch(console.error);
    "
    
    if ($test1Result -match "PASSED") {
        Write-Host "✓ Header display test PASSED" -ForegroundColor Green
    } else {
        Write-Host "✗ Header display test FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Header display test ERROR: $_" -ForegroundColor Red
}

# Test 2: Goals Count Functionality
Write-Host "`nTest 2: Testing active goals count..." -ForegroundColor Yellow
try {
    $test2Result = node -e "
        const { Builder, By, until } = require('selenium-webdriver');
        const chrome = require('selenium-webdriver/chrome');
        
        async function testGoalsCount() {
            const options = new chrome.Options();
            if ('$Headless' -eq 'True') {
                options.addArguments('--headless');
            }
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            
            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
            
            try {
                await driver.get('$BaseUrl/dashboard');
                await driver.wait(until.elementLocated(By.css('[data-testid=\"active-goals-badge\"]')), 10000);
                
                const badge = await driver.findElement(By.css('[data-testid=\"active-goals-badge\"]'));
                const badgeText = await badge.getText();
                const isDisplayed = await badge.isDisplayed();
                
                console.log('Goals count test:', (isDisplayed && badgeText.match(/^\d+|Loading|\.\.\.$/)) ? 'PASSED' : 'FAILED');
                console.log('Badge text:', badgeText);
                return isDisplayed && badgeText.match(/^\d+|Loading|\.\.\.$/);
            } finally {
                await driver.quit();
            }
        }
        
        testGoalsCount().catch(console.error);
    "
    
    if ($test2Result -match "PASSED") {
        Write-Host "✓ Goals count test PASSED" -ForegroundColor Green
    } else {
        Write-Host "✗ Goals count test FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Goals count test ERROR: $_" -ForegroundColor Red
}

# Test 3: User Menu Navigation
Write-Host "`nTest 3: Testing user menu navigation..." -ForegroundColor Yellow
try {
    $test3Result = node -e "
        const { Builder, By, until } = require('selenium-webdriver');
        const chrome = require('selenium-webdriver/chrome');
        
        async function testUserMenu() {
            const options = new chrome.Options();
            if ('$Headless' -eq 'True') {
                options.addArguments('--headless');
            }
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            
            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
            
            try {
                await driver.get('$BaseUrl/dashboard');
                await driver.wait(until.elementLocated(By.css('[data-testid=\"user-menu-trigger\"]')), 10000);
                
                const menuButton = await driver.findElement(By.css('[data-testid=\"user-menu-trigger\"]'));
                await menuButton.click();
                
                await driver.wait(until.elementLocated(By.css('[data-testid=\"user-menu-content\"]')), 5000);
                const menuContent = await driver.findElement(By.css('[data-testid=\"user-menu-content\"]'));
                const isDisplayed = await menuContent.isDisplayed();
                
                console.log('User menu test:', isDisplayed ? 'PASSED' : 'FAILED');
                return isDisplayed;
            } finally {
                await driver.quit();
            }
        }
        
        testUserMenu().catch(console.error);
    "
    
    if ($test3Result -match "PASSED") {
        Write-Host "✓ User menu test PASSED" -ForegroundColor Green
    } else {
        Write-Host "✗ User menu test FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ User menu test ERROR: $_" -ForegroundColor Red
}

# Test 4: Responsive Design
Write-Host "`nTest 4: Testing responsive design..." -ForegroundColor Yellow
try {
    $test4Result = node -e "
        const { Builder, By, until } = require('selenium-webdriver');
        const chrome = require('selenium-webdriver/chrome');
        
        async function testResponsiveDesign() {
            const options = new chrome.Options();
            if ('$Headless' -eq 'True') {
                options.addArguments('--headless');
            }
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            
            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
            
            try {
                // Test mobile viewport
                await driver.manage().window().setRect({ width: 375, height: 667 });
                await driver.get('$BaseUrl/dashboard');
                await driver.wait(until.elementLocated(By.css('[data-testid=\"user-header\"]')), 10000);
                
                const header = await driver.findElement(By.css('[data-testid=\"user-header\"]'));
                const isDisplayed = await header.isDisplayed();
                
                console.log('Responsive design test:', isDisplayed ? 'PASSED' : 'FAILED');
                return isDisplayed;
            } finally {
                await driver.quit();
            }
        }
        
        testResponsiveDesign().catch(console.error);
    "
    
    if ($test4Result -match "PASSED") {
        Write-Host "✓ Responsive design test PASSED" -ForegroundColor Green
    } else {
        Write-Host "✗ Responsive design test FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Responsive design test ERROR: $_" -ForegroundColor Red
}

# Test 5: Accessibility
Write-Host "`nTest 5: Testing accessibility features..." -ForegroundColor Yellow
try {
    $test5Result = node -e "
        const { Builder, By, until } = require('selenium-webdriver');
        const chrome = require('selenium-webdriver/chrome');
        
        async function testAccessibility() {
            const options = new chrome.Options();
            if ('$Headless' -eq 'True') {
                options.addArguments('--headless');
            }
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            
            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
            
            try {
                await driver.get('$BaseUrl/dashboard');
                await driver.wait(until.elementLocated(By.css('[data-testid=\"user-menu-trigger\"]')), 10000);
                
                const menuButton = await driver.findElement(By.css('[data-testid=\"user-menu-trigger\"]'));
                const ariaExpanded = await menuButton.getAttribute('aria-expanded');
                const ariaHaspopup = await menuButton.getAttribute('aria-haspopup');
                const ariaLabel = await menuButton.getAttribute('aria-label');
                
                const hasAccessibility = ariaExpanded === 'false' && 
                                       ariaHaspopup === 'menu' && 
                                       ariaLabel && ariaLabel.length > 0;
                
                console.log('Accessibility test:', hasAccessibility ? 'PASSED' : 'FAILED');
                console.log('aria-expanded:', ariaExpanded);
                console.log('aria-haspopup:', ariaHaspopup);
                console.log('aria-label:', ariaLabel);
                return hasAccessibility;
            } finally {
                await driver.quit();
            }
        }
        
        testAccessibility().catch(console.error);
    "
    
    if ($test5Result -match "PASSED") {
        Write-Host "✓ Accessibility test PASSED" -ForegroundColor Green
    } else {
        Write-Host "✗ Accessibility test FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Accessibility test ERROR: $_" -ForegroundColor Red
}

# Run full test suite with Mocha
Write-Host "`nRunning full test suite with Mocha..." -ForegroundColor Yellow
try {
    $mochaResult = npx mocha "tests/integration/user-header-integration.test.js" --timeout 30000
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Full test suite PASSED" -ForegroundColor Green
    } else {
        Write-Host "✗ Full test suite FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Full test suite ERROR: $_" -ForegroundColor Red
}

Write-Host "`nUser Header Integration Tests completed!" -ForegroundColor Green
Write-Host "For detailed test results, check the console output above." -ForegroundColor Yellow
