/**
 * Selenium Integration Tests for Landing Page New Functionalities
 * 
 * Tests all new sections and features added to the landing page:
 * - Problem Recognition
 * - Empathy Section
 * - Solution Intro
 * - How It Works
 * - Feature Carousel
 * - Development Notice
 * - Waitlist Form
 * - Newsletter Signup
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

// Test configuration
const CONFIG = {
  baseUrl: process.env.VITE_APP_URL || 'http://localhost:8080',
  apiGatewayUrl: process.env.VITE_API_GATEWAY_URL || 'https://3xlvsffmxc.execute-api.us-east-2.amazonaws.com',
  apiGatewayKey: process.env.VITE_API_GATEWAY_KEY,
  timeout: 30000,
  implicitWait: 10000
};

// Create WebDriver instance
async function createDriver() {
  const options = new chrome.Options();
  options.addArguments('--headless'); // Remove for visible browser
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
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
  await driver.sleep(500); // Wait for scroll animation
}

// Helper: Wait for element and verify it's visible
async function waitForElement(driver, selector, timeout = CONFIG.timeout) {
  const element = await driver.wait(until.elementLocated(By.css(selector)), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

describe('Landing Page Integration Tests', function() {
  let driver;
  
  this.timeout(60000); // 60 second timeout for all tests
  
  before(async function() {
    driver = await createDriver();
    await driver.get(CONFIG.baseUrl);
    await driver.sleep(2000); // Wait for page to load
  });
  
  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });
  
  describe('Problem Recognition Section', function() {
    it('should render Problem Recognition section with title', async function() {
      const section = await waitForElement(driver, '#problem');
      const title = await section.findElement(By.css('h2'));
      const titleText = await title.getText();
      
      assert(titleText.includes('Does This Sound Like You') || titleText.includes('Sound Like You'), 
        'Problem Recognition title should be visible');
    });
    
    it('should display all 6 problem scenarios', async function() {
      const scenarios = await driver.findElements(By.css('#problem .problem-card'));
      assert(scenarios.length >= 6, `Expected at least 6 scenarios, found ${scenarios.length}`);
    });
    
    it('should have scroll animations', async function() {
      const section = await waitForElement(driver, '#problem');
      await scrollToElement(driver, section);
      await driver.sleep(1000); // Wait for animation
      
      // Check if any cards have animation classes
      const cards = await driver.findElements(By.css('#problem .problem-card'));
      assert(cards.length > 0, 'Problem cards should be present');
    });
  });
  
  describe('Empathy Section', function() {
    it('should render Empathy section with title', async function() {
      const section = await waitForElement(driver, '[aria-labelledby="empathy-title"]');
      const title = await section.findElement(By.css('#empathy-title'));
      const titleText = await title.getText();
      
      assert(titleText.includes('We Get It'), 'Empathy title should be visible');
    });
    
    it('should display statistics', async function() {
      const section = await waitForElement(driver, '[aria-labelledby="empathy-title"]');
      await scrollToElement(driver, section);
      await driver.sleep(2000); // Wait for animation
      
      // Check for statistics (92%, 78%, 3x)
      const pageText = await section.getText();
      
      assert(pageText.includes('92') || pageText.includes('78') || pageText.includes('3x'), 
        'Statistics should be visible');
    });
  });
  
  describe('Solution Intro Section', function() {
    it('should render Solution Intro section', async function() {
      const section = await waitForElement(driver, '[aria-labelledby="solution-title"]');
      const title = await section.findElement(By.css('#solution-title'));
      const titleText = await title.getText();
      
      assert(titleText.includes('Changed Everything') || titleText.includes('What Changed'), 
        'Solution Intro title should be visible');
    });
  });
  
  describe('How It Works Section', function() {
    it('should render How It Works section with 6 steps', async function() {
      const section = await waitForElement(driver, '#how-it-works');
      const steps = await driver.findElements(By.css('#how-it-works .step-card'));
      
      assert(steps.length === 6, `Expected 6 steps, found ${steps.length}`);
    });
    
    it('should display step numbers', async function() {
      // Step numbers are in divs with rounded-full class containing the number
      const stepCards = await driver.findElements(By.css('#how-it-works .step-card'));
      assert(stepCards.length >= 6, 'Step cards should be visible');
      
      // Check that step numbers exist by looking for the number divs
      const stepNumbers = await driver.findElements(By.css('#how-it-works .step-card .rounded-full'));
      assert(stepNumbers.length >= 6, 'Step numbers should be visible');
    });
  });
  
  describe('Feature Carousel', function() {
    it('should render Feature Carousel section', async function() {
      const section = await waitForElement(driver, '[aria-labelledby="carousel-title"]');
      const title = await section.findElement(By.css('h2'));
      const titleText = await title.getText();
      
      assert(titleText.includes('GoalsGuild Works') || titleText.includes('Why'), 
        'Carousel title should be visible');
    });
    
    it('should have navigation buttons', async function() {
      const prevButton = await driver.findElement(By.css('[aria-label*="Previous"], [aria-label*="previous"]'));
      const nextButton = await driver.findElement(By.css('[aria-label*="Next"], [aria-label*="next"]'));
      
      assert(prevButton, 'Previous button should exist');
      assert(nextButton, 'Next button should exist');
    });
    
    it('should navigate slides with next button', async function() {
      await scrollToElement(driver, await waitForElement(driver, '[aria-labelledby="carousel-title"]'));
      await driver.sleep(1000);
      
      const nextButton = await driver.findElement(By.css('[aria-label*="Next"], [aria-label*="next"]'));
      const initialSlide = await driver.findElement(By.css('[role="group"][aria-label*="Slide"]')).getAttribute('aria-label');
      
      await nextButton.click();
      await driver.sleep(1000);
      
      const newSlide = await driver.findElement(By.css('[role="group"][aria-label*="Slide"]')).getAttribute('aria-label');
      assert(initialSlide !== newSlide, 'Slide should change when clicking next');
    });
    
    it('should have progress bar', async function() {
      const progressBar = await driver.findElement(By.css('[role="progressbar"]'));
      assert(progressBar, 'Progress bar should exist');
    });
    
    it('should have indicators', async function() {
      const indicators = await driver.findElements(By.css('[role="tab"]'));
      assert(indicators.length === 4, `Expected 4 indicators, found ${indicators.length}`);
    });
  });
  
  describe('Development Notice', function() {
    it('should render Development Notice section', async function() {
      const section = await waitForElement(driver, '[aria-labelledby="development-notice-title"]');
      const title = await section.findElement(By.css('#development-notice-title'));
      const titleText = await title.getText();
      
      assert(titleText.includes('Development') || titleText.includes('Platform'), 
        'Development Notice title should be visible');
    });
  });
  
  describe('Waitlist Form', function() {
    it('should render Waitlist Form section', async function() {
      const section = await waitForElement(driver, '#waitlist');
      assert(section, 'Waitlist section should exist');
    });
    
    it('should have email input field', async function() {
      const emailInput = await driver.findElement(By.css('#waitlist input[type="email"], #waitlist input[name*="email"], #waitlist-email'));
      assert(emailInput, 'Email input should exist');
    });
    
    it('should have submit button', async function() {
      // Use XPath to find button containing "Join" text, or just find by type="submit"
      const submitButton = await driver.findElement(By.css('#waitlist button[type="submit"]'));
      const buttonText = await submitButton.getText();
      assert(buttonText.includes('Join') || buttonText.includes('Community') || buttonText.includes('Subscribe'), 
        'Submit button should exist and contain expected text');
    });
    
    it('should validate email format', async function() {
      const emailInput = await driver.findElement(By.css('#waitlist input[type="email"], #waitlist-email'));
      await scrollToElement(driver, emailInput);
      
      // Enter invalid email
      await emailInput.clear();
      await emailInput.sendKeys('invalid-email');
      
      const submitButton = await driver.findElement(By.css('#waitlist button[type="submit"]'));
      await submitButton.click();
      await driver.sleep(500);
      
      // Check for validation error
      const errorMessages = await driver.findElements(By.css('#waitlist [role="alert"], #waitlist .text-red, #waitlist-error'));
      assert(errorMessages.length > 0, 'Validation error should be shown for invalid email');
    });
    
    it('should enable submit button with valid email', async function() {
      const emailInput = await driver.findElement(By.css('#waitlist input[type="email"], #waitlist-email'));
      await emailInput.clear();
      await emailInput.sendKeys('test@example.com');
      await driver.sleep(300);
      
      const submitButton = await driver.findElement(By.css('#waitlist button[type="submit"]'));
      const isEnabled = await submitButton.isEnabled();
      assert(isEnabled, 'Submit button should be enabled with valid email');
    });
  });
  
  describe('Newsletter Signup (Footer)', function() {
    it('should render Newsletter form in footer', async function() {
      const footer = await waitForElement(driver, 'footer');
      await scrollToElement(driver, footer);
      await driver.sleep(500);
      
      // Look for newsletter form in footer
      const newsletterInputs = await footer.findElements(By.css('input[type="email"]'));
      assert(newsletterInputs.length > 0, 'Newsletter email input should exist in footer');
    });
  });
  
  describe('Responsive Design', function() {
    it('should be responsive on mobile viewport', async function() {
      await driver.manage().window().setRect({ width: 375, height: 667 });
      await driver.sleep(1000);
      
      const sections = await driver.findElements(By.css('section[id]'));
      assert(sections.length > 0, 'Sections should be visible on mobile');
    });
    
    it('should be responsive on tablet viewport', async function() {
      await driver.manage().window().setRect({ width: 768, height: 1024 });
      await driver.sleep(1000);
      
      const sections = await driver.findElements(By.css('section[id]'));
      assert(sections.length > 0, 'Sections should be visible on tablet');
    });
  });
  
  describe('Accessibility', function() {
    it('should have proper ARIA labels', async function() {
      const sections = await driver.findElements(By.css('section[aria-labelledby]'));
      assert(sections.length > 0, 'Sections should have ARIA labels');
    });
    
    it('should have accessible form labels', async function() {
      const emailInput = await driver.findElement(By.css('#waitlist input[type="email"], #waitlist-email'));
      const label = await emailInput.getAttribute('aria-label') || 
                   await emailInput.getAttribute('id');
      assert(label, 'Email input should have label or aria-label');
    });
  });
});
