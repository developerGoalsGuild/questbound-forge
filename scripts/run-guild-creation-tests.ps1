# PowerShell script to run guild creation Selenium tests
# Tests the complete guild creation workflow

param(
    [string]$FrontendUrl = "http://localhost:5173",
    [string]$Browser = "chrome",
    [string]$TestUser = "test@example.com",
    [string]$TestPassword = "testpassword123"
)

Write-Host "Starting Guild Creation Tests..." -ForegroundColor Green

# Set environment variables
$env:FRONTEND_URL = $FrontendUrl
$env:BROWSER = $Browser
$env:TEST_USER_EMAIL = $TestUser
$env:TEST_USER_PASSWORD = $TestPassword

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Blue
} catch {
    Write-Error "Node.js is not installed or not in PATH"
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Blue
} catch {
    Write-Error "npm is not installed or not in PATH"
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if Selenium WebDriver is installed
try {
    $seleniumVersion = npm list selenium-webdriver
    Write-Host "Selenium WebDriver is installed" -ForegroundColor Blue
} catch {
    Write-Host "Installing Selenium WebDriver..." -ForegroundColor Yellow
    npm install selenium-webdriver
}

# Check if ChromeDriver is available
try {
    $chromeDriverVersion = chromedriver --version
    Write-Host "ChromeDriver version: $chromeDriverVersion" -ForegroundColor Blue
} catch {
    Write-Host "ChromeDriver not found. Installing..." -ForegroundColor Yellow
    npm install -g chromedriver
}

# Create test results directory
$testResultsDir = "test-results"
if (-not (Test-Path $testResultsDir)) {
    New-Item -ItemType Directory -Path $testResultsDir
}

# Run the guild creation tests
Write-Host "Running Guild Creation Tests..." -ForegroundColor Green

try {
    # Create a test script that focuses on guild creation
    $testScript = @"
const { Builder, By, until, Key } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');
const assert = require('assert');

class GuildCreationTests {
    constructor() {
        this.driver = null;
        this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        this.testUser = {
            email: process.env.TEST_USER_EMAIL || 'test@example.com',
            password: process.env.TEST_USER_PASSWORD || 'testpassword123',
            username: 'testuser'
        };
        this.testGuild = {
            name: 'Selenium Creation Test Guild',
            description: 'A guild created by Selenium automation tests',
            tags: ['selenium', 'testing', 'creation']
        };
    }

    async setup() {
        console.log('Setting up Selenium WebDriver...');
        const options = new Options();
        options.addArguments('--headless');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');

        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        await this.driver.manage().setTimeouts({ implicit: 10000 });
        console.log('WebDriver setup complete');
    }

    async teardown() {
        if (this.driver) {
            await this.driver.quit();
            console.log('WebDriver teardown complete');
        }
    }

    async login() {
        console.log('Logging in test user...');
        await this.driver.get(\`\${this.baseUrl}/login\`);
        
        // Wait for login form
        await this.driver.wait(until.elementLocated(By.id('email')), 10000);
        
        // Fill login form
        await this.driver.findElement(By.id('email')).sendKeys(this.testUser.email);
        await this.driver.findElement(By.id('password')).sendKeys(this.testUser.password);
        
        // Submit login
        await this.driver.findElement(By.css('button[type="submit"]')).click();
        
        // Wait for redirect to dashboard
        await this.driver.wait(until.urlContains('/dashboard'), 10000);
        console.log('Login successful');
    }

    async testGuildCreation() {
        console.log('Testing guild creation...');
        
        // Navigate to guilds page
        await this.driver.get(\`\${this.baseUrl}/guilds\`);
        await this.driver.wait(until.elementLocated(By.css('[data-testid="guilds-page"]')), 10000);
        
        // Click create guild button
        await this.driver.findElement(By.css('[data-testid="create-guild-button"]')).click();
        
        // Wait for create guild modal
        await this.driver.wait(until.elementLocated(By.css('[data-testid="create-guild-modal"]')), 10000);
        
        // Fill guild creation form
        await this.driver.findElement(By.css('[data-testid="guild-name-input"]')).sendKeys(this.testGuild.name);
        await this.driver.findElement(By.css('[data-testid="guild-description-input"]')).sendKeys(this.testGuild.description);
        
        // Add tags
        const tagsInput = await this.driver.findElement(By.css('[data-testid="guild-tags-input"]'));
        for (const tag of this.testGuild.tags) {
            await tagsInput.sendKeys(tag);
            await tagsInput.sendKeys(Key.ENTER);
        }
        
        // Select guild type
        await this.driver.findElement(By.css('[data-testid="guild-type-public"]')).click();
        
        // Submit form
        await this.driver.findElement(By.css('[data-testid="create-guild-submit"]')).click();
        
        // Wait for success message
        await this.driver.wait(until.elementLocated(By.css('[data-testid="guild-created-success"]')), 10000);
        
        console.log('Guild creation test passed');
    }

    async testGuildVerification() {
        console.log('Verifying guild creation...');
        
        // Wait for guilds list to load
        await this.driver.wait(until.elementLocated(By.css('[data-testid="guilds-list"]')), 10000);
        
        // Verify guild appears in list
        const guildElements = await this.driver.findElements(By.css('[data-testid="guild-card"]'));
        assert(guildElements.length > 0, 'No guilds found in list');
        
        // Find our test guild
        const testGuildElement = await this.driver.findElement(By.xpath(\`//*[contains(text(), "\${this.testGuild.name}")]\`));
        assert(testGuildElement, 'Test guild not found in list');
        
        console.log('Guild verification test passed');
    }

    async runTests() {
        try {
            console.log('Starting Guild Creation Tests...');
            
            await this.setup();
            await this.login();
            await this.testGuildCreation();
            await this.testGuildVerification();
            
            console.log('All Guild Creation Tests passed!');
            
        } catch (error) {
            console.error('Test failed:', error);
            throw error;
        } finally {
            await this.teardown();
        }
    }
}

// Run tests
const tests = new GuildCreationTests();
tests.runTests().catch(console.error);
"@

    # Write test script to temporary file
    $testScriptPath = "temp-guild-creation-tests.js"
    $testScript | Out-File -FilePath $testScriptPath -Encoding UTF8

    # Run the test script
    node $testScriptPath

    # Clean up
    Remove-Item $testScriptPath -Force

    Write-Host "Guild Creation Tests completed successfully!" -ForegroundColor Green

} catch {
    Write-Error "Guild Creation Tests failed: $($_.Exception.Message)"
    exit 1
}

Write-Host "Guild Creation Tests finished." -ForegroundColor Green


