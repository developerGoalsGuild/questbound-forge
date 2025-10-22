# PowerShell script to run guild management Selenium tests
# Tests the complete guild management workflow

param(
    [string]$FrontendUrl = "http://localhost:5173",
    [string]$Browser = "chrome",
    [string]$TestUser = "test@example.com",
    [string]$TestPassword = "testpassword123"
)

Write-Host "Starting Guild Management Tests..." -ForegroundColor Green

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

# Run the guild management tests
Write-Host "Running Guild Management Tests..." -ForegroundColor Green

try {
    # Create a test script that focuses on guild management
    $testScript = @"
const { Builder, By, until, Key } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');
const assert = require('assert');

class GuildManagementTests {
    constructor() {
        this.driver = null;
        this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        this.testUser = {
            email: process.env.TEST_USER_EMAIL || 'test@example.com',
            password: process.env.TEST_USER_PASSWORD || 'testpassword123',
            username: 'testuser'
        };
        this.testGuild = {
            name: 'Selenium Management Test Guild',
            description: 'A guild for testing management features',
            tags: ['selenium', 'testing', 'management']
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
        console.log('Creating test guild...');
        
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
        
        console.log('Guild creation completed');
    }

    async testGuildJoin() {
        console.log('Testing guild join...');
        
        // Navigate to guild details
        const guildCard = await this.driver.findElement(By.xpath(\`//*[contains(text(), "\${this.testGuild.name}")]\`));
        await guildCard.click();
        
        // Wait for guild details page
        await this.driver.wait(until.elementLocated(By.css('[data-testid="guild-details"]')), 10000);
        
        // Click join button
        await this.driver.findElement(By.css('[data-testid="join-guild-button"]')).click();
        
        // Wait for success message
        await this.driver.wait(until.elementLocated(By.css('[data-testid="join-success"]')), 10000);
        
        console.log('Guild join test passed');
    }

    async testGuildMembers() {
        console.log('Testing guild members...');
        
        // Click on members tab
        await this.driver.findElement(By.css('[data-testid="members-tab"]')).click();
        
        // Wait for members list
        await this.driver.wait(until.elementLocated(By.css('[data-testid="members-list"]')), 10000);
        
        // Verify members are displayed
        const memberElements = await this.driver.findElements(By.css('[data-testid="member-card"]'));
        assert(memberElements.length > 0, 'No members found');
        
        // Verify test user is in members list
        const testUserElement = await this.driver.findElement(By.xpath(\`//*[contains(text(), "\${this.testUser.username}")]\`));
        assert(testUserElement, 'Test user not found in members list');
        
        console.log('Guild members test passed');
    }

    async testGuildComments() {
        console.log('Testing guild comments...');
        
        // Click on comments tab
        await this.driver.findElement(By.css('[data-testid="comments-tab"]')).click();
        
        // Wait for comments section
        await this.driver.wait(until.elementLocated(By.css('[data-testid="comments-section"]')), 10000);
        
        // Add a comment
        const commentText = 'This is a test comment from Selenium automation';
        await this.driver.findElement(By.css('[data-testid="comment-input"]')).sendKeys(commentText);
        await this.driver.findElement(By.css('[data-testid="submit-comment"]')).click();
        
        // Wait for comment to appear
        await this.driver.wait(until.elementLocated(By.xpath(\`//*[contains(text(), "\${commentText}")]\`)), 10000);
        
        console.log('Guild comments test passed');
    }

    async testGuildAnalytics() {
        console.log('Testing guild analytics...');
        
        // Click on analytics tab
        await this.driver.findElement(By.css('[data-testid="analytics-tab"]')).click();
        
        // Wait for analytics section
        await this.driver.wait(until.elementLocated(By.css('[data-testid="analytics-section"]')), 10000);
        
        // Verify analytics data is displayed
        const memberCount = await this.driver.findElement(By.css('[data-testid="member-count"]')).getText();
        assert(parseInt(memberCount) > 0, 'Member count should be greater than 0');
        
        const goalCount = await this.driver.findElement(By.css('[data-testid="goal-count"]')).getText();
        assert(parseInt(goalCount) >= 0, 'Goal count should be non-negative');
        
        console.log('Guild analytics test passed');
    }

    async testGuildEdit() {
        console.log('Testing guild edit...');
        
        // Click edit button
        await this.driver.findElement(By.css('[data-testid="edit-guild-button"]')).click();
        
        // Wait for edit modal
        await this.driver.wait(until.elementLocated(By.css('[data-testid="edit-guild-modal"]')), 10000);
        
        // Update guild name
        const nameInput = await this.driver.findElement(By.css('[data-testid="guild-name-input"]'));
        await nameInput.clear();
        await nameInput.sendKeys('Updated Selenium Management Test Guild');
        
        // Update description
        const descriptionInput = await this.driver.findElement(By.css('[data-testid="guild-description-input"]'));
        await descriptionInput.clear();
        await descriptionInput.sendKeys('Updated description from Selenium automation');
        
        // Submit changes
        await this.driver.findElement(By.css('[data-testid="save-guild-changes"]')).click();
        
        // Wait for success message
        await this.driver.wait(until.elementLocated(By.css('[data-testid="guild-updated-success"]')), 10000);
        
        console.log('Guild edit test passed');
    }

    async testGuildSearch() {
        console.log('Testing guild search...');
        
        // Navigate back to guilds page
        await this.driver.get(\`\${this.baseUrl}/guilds\`);
        
        // Wait for guilds page
        await this.driver.wait(until.elementLocated(By.css('[data-testid="guilds-page"]')), 10000);
        
        // Use search functionality
        const searchInput = await this.driver.findElement(By.css('[data-testid="guild-search-input"]'));
        await searchInput.sendKeys('Selenium');
        
        // Wait for search results
        await this.driver.wait(until.elementLocated(By.css('[data-testid="search-results"]')), 10000);
        
        // Verify search results
        const searchResults = await this.driver.findElements(By.css('[data-testid="guild-card"]'));
        assert(searchResults.length > 0, 'No search results found');
        
        // Verify our test guild appears in search results
        const testGuildElement = await this.driver.findElement(By.xpath(\`//*[contains(text(), "Updated Selenium Management Test Guild")]\`));
        assert(testGuildElement, 'Test guild not found in search results');
        
        console.log('Guild search test passed');
    }

    async testGuildFiltering() {
        console.log('Testing guild filtering...');
        
        // Test tag filtering
        const tagFilter = await this.driver.findElement(By.css('[data-testid="tag-filter-selenium"]'));
        await tagFilter.click();
        
        // Wait for filtered results
        await this.driver.wait(until.elementLocated(By.css('[data-testid="filtered-results"]')), 10000);
        
        // Verify filtered results
        const filteredResults = await this.driver.findElements(By.css('[data-testid="guild-card"]'));
        assert(filteredResults.length > 0, 'No filtered results found');
        
        // Verify our test guild appears in filtered results
        const testGuildElement = await this.driver.findElement(By.xpath(\`//*[contains(text(), "Updated Selenium Management Test Guild")]\`));
        assert(testGuildElement, 'Test guild not found in filtered results');
        
        console.log('Guild filtering test passed');
    }

    async testGuildLeave() {
        console.log('Testing guild leave...');
        
        // Navigate to guild details
        const guildCard = await this.driver.findElement(By.xpath(\`//*[contains(text(), "Updated Selenium Management Test Guild")]\`));
        await guildCard.click();
        
        // Wait for guild details page
        await this.driver.wait(until.elementLocated(By.css('[data-testid="guild-details"]')), 10000);
        
        // Click leave button
        await this.driver.findElement(By.css('[data-testid="leave-guild-button"]')).click();
        
        // Confirm leave action
        await this.driver.wait(until.elementLocated(By.css('[data-testid="confirm-leave"]')), 10000);
        await this.driver.findElement(By.css('[data-testid="confirm-leave"]')).click();
        
        // Wait for success message
        await this.driver.wait(until.elementLocated(By.css('[data-testid="leave-success"]')), 10000);
        
        console.log('Guild leave test passed');
    }

    async testGuildDeletion() {
        console.log('Testing guild deletion...');
        
        // Navigate to guild details
        const guildCard = await this.driver.findElement(By.xpath(\`//*[contains(text(), "Updated Selenium Management Test Guild")]\`));
        await guildCard.click();
        
        // Wait for guild details page
        await this.driver.wait(until.elementLocated(By.css('[data-testid="guild-details"]')), 10000);
        
        // Click delete button
        await this.driver.findElement(By.css('[data-testid="delete-guild-button"]')).click();
        
        // Confirm deletion
        await this.driver.wait(until.elementLocated(By.css('[data-testid="confirm-delete"]')), 10000);
        await this.driver.findElement(By.css('[data-testid="confirm-delete"]')).click();
        
        // Wait for success message
        await this.driver.wait(until.elementLocated(By.css('[data-testid="guild-deleted-success"]')), 10000);
        
        console.log('Guild deletion test passed');
    }

    async runTests() {
        try {
            console.log('Starting Guild Management Tests...');
            
            await this.setup();
            await this.login();
            await this.testGuildCreation();
            await this.testGuildJoin();
            await this.testGuildMembers();
            await this.testGuildComments();
            await this.testGuildAnalytics();
            await this.testGuildEdit();
            await this.testGuildSearch();
            await this.testGuildFiltering();
            await this.testGuildLeave();
            await this.testGuildDeletion();
            
            console.log('All Guild Management Tests passed!');
            
        } catch (error) {
            console.error('Test failed:', error);
            throw error;
        } finally {
            await this.teardown();
        }
    }
}

// Run tests
const tests = new GuildManagementTests();
tests.runTests().catch(console.error);
"@

    # Write test script to temporary file
    $testScriptPath = "temp-guild-management-tests.js"
    $testScript | Out-File -FilePath $testScriptPath -Encoding UTF8

    # Run the test script
    node $testScriptPath

    # Clean up
    Remove-Item $testScriptPath -Force

    Write-Host "Guild Management Tests completed successfully!" -ForegroundColor Green

} catch {
    Write-Error "Guild Management Tests failed: $($_.Exception.Message)"
    exit 1
}

Write-Host "Guild Management Tests finished." -ForegroundColor Green


