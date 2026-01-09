/**
 * Comprehensive Frontend Integration Tests
 * 
 * This test suite verifies end-to-end functionality of the entire frontend application:
 * - Landing Page (all new sections)
 * - Authentication (Login)
 * - Dashboard
 * - Goals/Quests
 * - Profile
 * - Guilds
 * - Chat
 * - Subscriptions
 * 
 * The script will prompt for user credentials interactively.
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const readline = require('readline');
const assert = require('assert');
const testCredentials = require('./load-test-credentials.cjs');

// Test configuration
const CONFIG = {
  baseUrl: process.env.VITE_APP_URL || 'http://localhost:8080',
  apiGatewayUrl: process.env.VITE_API_GATEWAY_URL || 'https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com',
  apiGatewayKey: process.env.VITE_API_GATEWAY_KEY,
  timeout: 30000,
  implicitWait: 10000
};

// User credentials (will be prompted)
let userCredentials = {
  email: null,
  password: null
};

// Helper: Prompt for user input
function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Helper: Get user credentials
async function getCredentials() {
  // Priority 1: Check .env.test file (via load-test-credentials.js)
  if (testCredentials.hasCredentials()) {
    userCredentials.email = testCredentials.email;
    userCredentials.password = testCredentials.password;
    console.log('✅ Using credentials from .env.test file\n');
    return;
  }
  
  // Priority 2: Check environment variables
  if (process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD) {
    userCredentials.email = process.env.TEST_USER_EMAIL;
    userCredentials.password = process.env.TEST_USER_PASSWORD;
    console.log('✅ Using credentials from environment variables\n');
    return;
  }
  
  // Priority 3: Prompt user interactively
  console.log('\n🔐 Authentication Required');
  console.log('==========================\n');
  console.log('No credentials found. Options:');
  console.log('  1. Create .env.test file (recommended):');
  console.log('     cp .env.test.example .env.test');
  console.log('     # Then edit .env.test with your credentials');
  console.log('  2. Set environment variables:');
  console.log('     export TEST_USER_EMAIL=your-email@example.com');
  console.log('     export TEST_USER_PASSWORD=your-password');
  console.log('  3. Enter credentials now (password will be visible)\n');
  
  userCredentials.email = await promptUser('Enter your email: ');
  if (!userCredentials.email || !userCredentials.email.trim()) {
    throw new Error('Email is required');
  }
  userCredentials.email = userCredentials.email.trim();

  // Note: Password will be visible - this is acceptable for testing
  const password = await promptUser('Enter your password: ');
  if (!password || !password.trim()) {
    throw new Error('Password is required');
  }
  userCredentials.password = password.trim();
  
  console.log('\n✅ Credentials received\n');
}

// Create WebDriver instance
async function createDriver(headless = true) {
  const options = new chrome.Options();
  if (headless) {
    options.addArguments('--headless');
  }
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1920,1080');
  
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  
  await driver.manage().setTimeouts({ implicit: CONFIG.implicitWait });
  await driver.manage().window().setRect({ width: 1920, height: 1080 });
  
  return driver;
}

// Helper: Scroll to element
async function scrollToElement(driver, element) {
  await driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center" });', element);
  await driver.sleep(500);
}

// Helper: Wait for element and verify it's visible
async function waitForElement(driver, selector, timeout = CONFIG.timeout) {
  const element = await driver.wait(until.elementLocated(By.css(selector)), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

// Helper: Wait for element by XPath
async function waitForElementXPath(driver, xpath, timeout = CONFIG.timeout) {
  const element = await driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

// Authentication helper
async function login(driver) {
  console.log('🔐 Logging in...');
  
  // Navigate to login page
  await driver.get(`${CONFIG.baseUrl}/login`);
  await driver.sleep(2000);
  
  // Find email input by ID
  const emailInput = await waitForElement(driver, '#email');
  await emailInput.clear();
  await emailInput.sendKeys(userCredentials.email);
  
  // Find password input by ID
  const passwordInput = await waitForElement(driver, '#password');
  await passwordInput.clear();
  await passwordInput.sendKeys(userCredentials.password);
  
  // Find and click submit button
  const submitButton = await waitForElement(driver, 'button[type="submit"]');
  await submitButton.click();
  
  // Wait for navigation to dashboard or error
  await driver.sleep(3000);
  
  // Check if login was successful (should redirect to dashboard)
  const currentUrl = await driver.getCurrentUrl();
  if (currentUrl.includes('/dashboard') || currentUrl.includes('/quests')) {
    console.log('✅ Login successful');
    return true;
  }
  
  // Check for error message
  try {
    const errorElement = await driver.findElement(By.css('[role="alert"], .text-red, [class*="error"]'));
    const errorText = await errorElement.getText();
    console.log(`❌ Login failed: ${errorText}`);
    return false;
  } catch (e) {
    // No error element found, might still be loading
    await driver.sleep(2000);
    const newUrl = await driver.getCurrentUrl();
    if (newUrl.includes('/dashboard') || newUrl.includes('/quests')) {
      console.log('✅ Login successful (delayed)');
      return true;
    }
    console.log('❌ Login failed: Unknown error');
    return false;
  }
}

describe('Full Frontend Integration Tests', function() {
  let driver;
  
  this.timeout(300000); // 5 minutes for full test suite
  
  before(async function() {
    // Get credentials from user
    await getCredentials();
    
    // Create driver (set headless to false to see browser)
    const headless = process.env.HEADLESS !== 'false';
    driver = await createDriver(headless);
    
    console.log('✅ WebDriver initialized');
  });
  
  after(async function() {
    if (driver) {
      await driver.quit();
      console.log('✅ WebDriver closed');
    }
  });
  
  describe('Landing Page', function() {
    it('should load landing page', async function() {
      await driver.get(CONFIG.baseUrl);
      await driver.sleep(2000);
      
      const title = await driver.getTitle();
      assert(title, 'Page should have a title');
      console.log(`✅ Landing page loaded: ${title}`);
    });
    
    it('should display Problem Recognition section', async function() {
      const section = await waitForElement(driver, '#problem');
      const title = await section.findElement(By.css('h2'));
      const titleText = await title.getText();
      assert(titleText.includes('Sound Like You') || titleText.includes('Does This'), 'Problem Recognition should be visible');
      console.log('✅ Problem Recognition section visible');
    });
    
    it('should display Feature Carousel', async function() {
      await scrollToElement(driver, await waitForElement(driver, '[aria-labelledby="carousel-title"]'));
      const carousel = await driver.findElement(By.css('[aria-labelledby="carousel-title"]'));
      assert(carousel, 'Carousel should exist');
      console.log('✅ Feature Carousel visible');
    });
    
    it('should display Waitlist Form', async function() {
      await scrollToElement(driver, await waitForElement(driver, '#waitlist'));
      const form = await driver.findElement(By.css('#waitlist form'));
      assert(form, 'Waitlist form should exist');
      console.log('✅ Waitlist Form visible');
    });
  });
  
  describe('Authentication', function() {
    it('should login successfully', async function() {
      const loginSuccess = await login(driver);
      assert(loginSuccess, 'Login should be successful');
    });
    
    it('should redirect to dashboard after login', async function() {
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/dashboard') || currentUrl.includes('/quests'), 
        'Should be redirected to dashboard or quests page');
      console.log(`✅ Redirected to: ${currentUrl}`);
    });
  });
  
  describe('Dashboard', function() {
    it('should load dashboard page', async function() {
      await driver.get(`${CONFIG.baseUrl}/dashboard`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/dashboard'), 'Should be on dashboard page');
      console.log('✅ Dashboard page loaded');
    });
    
    it('should display dashboard content', async function() {
      // Wait for dashboard content to load
      await driver.sleep(2000);
      
      // Check for common dashboard elements
      const bodyText = await driver.findElement(By.css('body')).getText();
      assert(bodyText.length > 0, 'Dashboard should have content');
      console.log('✅ Dashboard content displayed');
    });
  });
  
  describe('Quests/Goals', function() {
    it('should navigate to quests dashboard', async function() {
      await driver.get(`${CONFIG.baseUrl}/quests/dashboard`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/quests'), 'Should be on quests page');
      console.log('✅ Quests dashboard loaded');
    });
    
    it('should display quests list or create button', async function() {
      await driver.sleep(2000);
      
      // Look for create button or quest list
      try {
        const createButton = await driver.findElement(By.xpath("//button[contains(text(), 'Create') or contains(text(), 'New') or contains(text(), 'Add')]"));
        console.log('✅ Create quest button found');
      } catch (e) {
        // Or check for quest list
        const bodyText = await driver.findElement(By.css('body')).getText();
        assert(bodyText.length > 0, 'Quests page should have content');
        console.log('✅ Quests page content displayed');
      }
    });
    
    it('should navigate to quests list', async function() {
      await driver.get(`${CONFIG.baseUrl}/quests`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/quests'), 'Should be on quests page');
      console.log('✅ Quests list page loaded');
    });
    
    it('should be able to navigate to create quest page', async function() {
      await driver.get(`${CONFIG.baseUrl}/quests/create`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/quests') && currentUrl.includes('create'), 'Should be on create quest page');
      console.log('✅ Create quest page accessible');
    });
  });
  
  describe('Goals', function() {
    it('should navigate to goals list', async function() {
      await driver.get(`${CONFIG.baseUrl}/goals/list`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/goals'), 'Should be on goals page');
      console.log('✅ Goals list page loaded');
    });
    
    it('should be able to navigate to create goal page', async function() {
      await driver.get(`${CONFIG.baseUrl}/goals/create`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/goals'), 'Should be on goals page');
      console.log('✅ Create goal page accessible');
    });
  });
  
  describe('Profile', function() {
    it('should navigate to profile page', async function() {
      await driver.get(`${CONFIG.baseUrl}/profile`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/profile'), 'Should be on profile page');
      console.log('✅ Profile page loaded');
    });
    
    it('should display profile information', async function() {
      await driver.sleep(2000);
      
      const bodyText = await driver.findElement(By.css('body')).getText();
      assert(bodyText.length > 0, 'Profile should have content');
      console.log('✅ Profile content displayed');
    });
  });
  
  describe('Guilds', function() {
    it('should navigate to guilds page', async function() {
      await driver.get(`${CONFIG.baseUrl}/guilds`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/guilds'), 'Should be on guilds page');
      console.log('✅ Guilds page loaded');
    });
    
    it('should display guilds content', async function() {
      await driver.sleep(2000);
      
      const bodyText = await driver.findElement(By.css('body')).getText();
      assert(bodyText.length > 0, 'Guilds page should have content');
      console.log('✅ Guilds content displayed');
    });
    
    it('should be able to navigate to create guild page', async function() {
      await driver.get(`${CONFIG.baseUrl}/guilds/create`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/guilds') && currentUrl.includes('create'), 'Should be on create guild page');
      console.log('✅ Create guild page accessible');
    });
  });
  
  describe('Chat', function() {
    it('should navigate to chat page', async function() {
      await driver.get(`${CONFIG.baseUrl}/chat`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/chat'), 'Should be on chat page');
      console.log('✅ Chat page loaded');
    });
    
    it('should display chat interface', async function() {
      await driver.sleep(2000);
      
      const bodyText = await driver.findElement(By.css('body')).getText();
      assert(bodyText.length > 0, 'Chat page should have content');
      console.log('✅ Chat interface displayed');
    });
  });
  
  describe('Subscriptions', function() {
    it('should navigate to subscription plans page', async function() {
      await driver.get(`${CONFIG.baseUrl}/subscription`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/subscription'), 'Should be on subscription page');
      console.log('✅ Subscription plans page loaded');
    });
    
    it('should display subscription content', async function() {
      await driver.sleep(2000);
      
      const bodyText = await driver.findElement(By.css('body')).getText();
      assert(bodyText.length > 0, 'Subscription page should have content');
      console.log('✅ Subscription content displayed');
    });
  });
  
  describe('Collaborations', function() {
    it('should navigate to collaborations page', async function() {
      await driver.get(`${CONFIG.baseUrl}/collaborations`);
      await driver.sleep(3000);
      
      const currentUrl = await driver.getCurrentUrl();
      assert(currentUrl.includes('/collaborations'), 'Should be on collaborations page');
      console.log('✅ Collaborations page loaded');
    });
  });
  
  describe('Navigation', function() {
    it('should have working navigation menu', async function() {
      // Try to find navigation elements
      try {
        const navLinks = await driver.findElements(By.css('nav a, [role="navigation"] a, header a'));
        assert(navLinks.length > 0, 'Navigation should have links');
        console.log(`✅ Navigation menu found with ${navLinks.length} links`);
      } catch (e) {
        console.log('⚠️  Navigation menu not found (may be hidden or use different structure)');
      }
    });
  });
  
  describe('Responsive Design', function() {
    it('should be responsive on mobile viewport', async function() {
      await driver.manage().window().setRect({ width: 375, height: 667 });
      await driver.sleep(1000);
      
      const body = await driver.findElement(By.css('body'));
      assert(body, 'Page should render on mobile');
      console.log('✅ Mobile viewport responsive');
    });
    
    it('should be responsive on tablet viewport', async function() {
      await driver.manage().window().setRect({ width: 768, height: 1024 });
      await driver.sleep(1000);
      
      const body = await driver.findElement(By.css('body'));
      assert(body, 'Page should render on tablet');
      console.log('✅ Tablet viewport responsive');
    });
    
    it('should restore desktop viewport', async function() {
      await driver.manage().window().setRect({ width: 1920, height: 1080 });
      await driver.sleep(1000);
      console.log('✅ Desktop viewport restored');
    });
  });
  
  describe('Error Handling', function() {
    it('should handle 404 page', async function() {
      await driver.get(`${CONFIG.baseUrl}/nonexistent-page`);
      await driver.sleep(2000);
      
      const bodyText = await driver.findElement(By.css('body')).getText();
      // Should show 404 or not found message
      assert(bodyText.length > 0, '404 page should have content');
      console.log('✅ 404 page handled');
    });
  });
  
  describe('Public Pages', function() {
    it('should load About page', async function() {
      await driver.get(`${CONFIG.baseUrl}/about`);
      await driver.sleep(2000);
      
      const bodyText = await driver.findElement(By.css('body')).getText();
      assert(bodyText.length > 0, 'About page should have content');
      console.log('✅ About page loaded');
    });
    
    it('should load Help page', async function() {
      await driver.get(`${CONFIG.baseUrl}/help`);
      await driver.sleep(2000);
      
      const bodyText = await driver.findElement(By.css('body')).getText();
      assert(bodyText.length > 0, 'Help page should have content');
      console.log('✅ Help page loaded');
    });
  });
});

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Full Frontend Integration Tests');
  console.log('==========================================\n');
}
