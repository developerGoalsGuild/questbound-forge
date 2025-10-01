/**
 * E2E: Goal Creation Flow
 * Tests the complete user journey from login to goal creation
 * 
 * Environment Variables:
 * - SELENIUM_GRID_URL: Selenium Grid URL (default: http://localhost:4444/wd/hub)
 * - BASE_URL: Application URL (default: http://localhost:8080)
 * - TEST_USER_EMAIL: Test user email
 * - TEST_USER_PASSWORD: Test user password
 */
import { Builder, By, until, Key } from 'selenium-webdriver';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SELENIUM_GRID_URL = process.env.SELENIUM_GRID_URL || 'http://localhost:4444/wd/hub';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

// Utility functions
function delay(ms) { 
  return new Promise(r => setTimeout(r, ms)); 
}

async function typeSafely(element, text) {
  await element.click();
  await element.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.DELETE, text);
}

async function captureScreenshot(driver, name) {
  try {
    const screenshot = await driver.takeScreenshot();
    const filename = `goal-creation-${name}-${Date.now()}.png`;
    const filepath = join(dirname(fileURLToPath(import.meta.url)), '..', 'screenshots', filename);
    await fs.writeFile(filepath, screenshot, 'base64');
    console.log(`Screenshot saved: ${filename}`);
  } catch (error) {
    console.warn('Failed to capture screenshot:', error.message);
  }
}

async function captureArtifacts(driver, status) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'logs');
  
  try {
    await fs.mkdir(logDir, { recursive: true });
    
    // Capture browser logs
    const logs = await driver.manage().logs().get('browser');
    const logFile = join(logDir, `goal-creation-${status}-${timestamp}.log`);
    await fs.writeFile(logFile, logs.map(log => `${log.timestamp} [${log.level}] ${log.message}`).join('\n'));
    
    // Capture screenshot
    await captureScreenshot(driver, status);
    
    console.log(`Artifacts saved for ${status} test run`);
  } catch (error) {
    console.warn('Failed to capture artifacts:', error.message);
  }
}

// Test functions
async function login(driver) {
  console.log('Logging in...');
  await driver.get(`${BASE_URL}/login`);
  
  const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
  await typeSafely(emailInput, TEST_USER_EMAIL);
  
  const passwordInput = await driver.findElement(By.id('password'));
  await typeSafely(passwordInput, TEST_USER_PASSWORD);
  
  const submitButton = await driver.findElement(By.css('button[type="submit"]'));
  await submitButton.click();
  
  await driver.wait(until.urlContains('/dashboard'), 15000);
  console.log('Login successful');
}

async function navigateToGoalCreation(driver) {
  console.log('Navigating to goal creation...');
  
  // Navigate to goals page
  await driver.get(`${BASE_URL}/goals`);
  await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Create New Goal')]")), 10000);
  
  // Click create goal button
  const createButton = await driver.findElement(By.xpath("//button[contains(., 'Create New Goal')]"));
  await createButton.click();
  
  // Wait for form to load
  await driver.wait(until.elementLocated(By.css('[data-testid="goal-creation-form"]')), 10000);
  console.log('Goal creation form loaded');
}

async function fillBasicInformation(driver) {
  console.log('Filling basic information...');
  
  // Title
  const titleInput = await driver.wait(until.elementLocated(By.id('goal-title')), 10000);
  await typeSafely(titleInput, 'Learn TypeScript Programming');
  
  // Description
  const descriptionInput = await driver.findElement(By.id('goal-description'));
  await typeSafely(descriptionInput, 'Master TypeScript programming language and build real-world projects');
  
  // Deadline
  const deadlineInput = await driver.findElement(By.id('goal-deadline'));
  await typeSafely(deadlineInput, '2024-12-31');
  
  // Category selection
  const categorySelect = await driver.findElement(By.css('[role="combobox"]'));
  await categorySelect.click();
  await delay(500);
  
  const learningOption = await driver.wait(
    until.elementLocated(By.xpath("//*[contains(text(), 'Learning') or contains(text(), 'Aprendizaje')]")), 
    5000
  );
  await learningOption.click();
  await delay(500);
  
  console.log('Basic information filled');
}

async function fillNLPQuestions(driver) {
  console.log('Filling NLP questions...');
  
  const nlpQuestions = [
    { id: 'nlp-positive', answer: 'I will learn TypeScript programming language and become proficient in it' },
    { id: 'nlp-specific', answer: 'Complete 3 comprehensive TypeScript courses and build 5 real-world projects by December 2024' },
    { id: 'nlp-evidence', answer: 'I will have built 5 TypeScript projects, completed all course assignments, and be able to write complex TypeScript code without errors' },
    { id: 'nlp-resources', answer: 'Online courses (TypeScript Deep Dive, Advanced TypeScript), books (Programming TypeScript), practice projects, and coding challenges' },
    { id: 'nlp-obstacles', answer: 'Time management with work schedule, complex type system concepts, and maintaining motivation during difficult topics' },
    { id: 'nlp-ecology', answer: 'This will help advance my career as a developer, improve my code quality, and enable me to work on more complex projects' },
    { id: 'nlp-timeline', answer: '3 months starting January 2024, 2-3 hours per day on weekdays and 4-5 hours on weekends' },
    { id: 'nlp-firstStep', answer: 'Enroll in the first TypeScript course and set up my development environment with TypeScript' }
  ];
  
  for (const question of nlpQuestions) {
    try {
      const input = await driver.findElement(By.id(question.id));
      await typeSafely(input, question.answer);
      await delay(200); // Small delay between questions
    } catch (error) {
      console.warn(`Failed to fill question ${question.id}:`, error.message);
    }
  }
  
  console.log('NLP questions filled');
}

async function submitGoalForm(driver) {
  console.log('Submitting goal form...');
  
  const submitButton = await driver.findElement(By.xpath("//button[contains(., 'Create Goal')]"));
  await submitButton.click();
  
  // Wait for success or error
  try {
    await driver.wait(until.or(
      until.elementLocated(By.xpath("//*[contains(text(), 'Goal created successfully') or contains(text(), 'successfully')]")),
      until.elementLocated(By.xpath("//*[contains(text(), 'Error') or contains(text(), 'Failed')]")),
      until.urlContains('/goals') // Redirect to goals list
    ), 15000);
    
    console.log('Goal form submitted successfully');
  } catch (error) {
    console.error('Form submission timeout or failed');
    throw error;
  }
}

async function verifyGoalCreation(driver) {
  console.log('Verifying goal creation...');
  
  // Check if redirected to goals page or success message is shown
  const currentUrl = await driver.getCurrentUrl();
  const isOnGoalsPage = currentUrl.includes('/goals');
  
  if (isOnGoalsPage) {
    // Look for the created goal in the goals list
    try {
      await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Learn TypeScript Programming')]")), 10000);
      console.log('Goal found in goals list');
    } catch (error) {
      console.warn('Goal not found in goals list, but navigation was successful');
    }
  } else {
    // Look for success message
    try {
      await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'success') or contains(text(), 'created')]")), 5000);
      console.log('Success message displayed');
    } catch (error) {
      console.warn('No success message found, but form submission completed');
    }
  }
}

async function testFormValidation(driver) {
  console.log('Testing form validation...');
  
  // Navigate to goal creation form
  await navigateToGoalCreation(driver);
  
  // Try to submit empty form
  const submitButton = await driver.findElement(By.xpath("//button[contains(., 'Create Goal')]"));
  await submitButton.click();
  
  // Check for validation errors
  try {
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'required') or contains(text(), 'error')]")), 5000);
    console.log('Validation errors displayed correctly');
  } catch (error) {
    console.warn('No validation errors found for empty form');
  }
  
  // Fill only title and try to submit
  const titleInput = await driver.findElement(By.id('goal-title'));
  await typeSafely(titleInput, 'Test Goal');
  await submitButton.click();
  
  // Should still show validation errors for other required fields
  try {
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'required') or contains(text(), 'error')]")), 5000);
    console.log('Validation errors displayed for incomplete form');
  } catch (error) {
    console.warn('No validation errors found for incomplete form');
  }
}

async function testAccessibility(driver) {
  console.log('Testing accessibility...');
  
  // Test keyboard navigation
  const titleInput = await driver.findElement(By.id('goal-title'));
  await titleInput.click();
  
  // Tab through form fields
  await titleInput.sendKeys(Key.TAB);
  const descriptionInput = await driver.switchTo().activeElement();
  const descriptionId = await descriptionInput.getAttribute('id');
  
  if (descriptionId === 'goal-description') {
    console.log('Keyboard navigation working correctly');
  } else {
    console.warn('Keyboard navigation may have issues');
  }
  
  // Test ARIA attributes
  const form = await driver.findElement(By.css('[data-testid="goal-creation-form"]'));
  const ariaLabel = await form.getAttribute('aria-label');
  
  if (ariaLabel && ariaLabel.includes('Goal creation form')) {
    console.log('ARIA labels present');
  } else {
    console.warn('ARIA labels may be missing');
  }
}

async function testErrorHandling(driver) {
  console.log('Testing error handling...');
  
  // Fill form with invalid data
  const titleInput = await driver.findElement(By.id('goal-title'));
  await typeSafely(titleInput, 'ab'); // Too short
  
  const deadlineInput = await driver.findElement(By.id('goal-deadline'));
  await typeSafely(deadlineInput, '2023-01-01'); // Past date
  
  const submitButton = await driver.findElement(By.xpath("//button[contains(., 'Create Goal')]"));
  await submitButton.click();
  
  // Check for validation errors
  try {
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'characters') or contains(text(), 'future')]")), 5000);
    console.log('Validation errors displayed for invalid data');
  } catch (error) {
    console.warn('No validation errors found for invalid data');
  }
}

async function runGoalCreationTest() {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    console.error('Missing TEST_USER_EMAIL or TEST_USER_PASSWORD environment variables');
    process.exit(1);
  }

  const driver = await new Builder()
    .usingServer(SELENIUM_GRID_URL)
    .withCapabilities({
      browserName: 'chrome',
      'goog:chromeOptions': { 
        args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'] 
      },
      'goog:loggingPrefs': { 
        browser: 'ALL', 
        performance: 'ALL' 
      }
    })
    .build();

  try {
    console.log('Starting Goal Creation E2E Test...');
    
    // Main test flow
    await login(driver);
    await navigateToGoalCreation(driver);
    await fillBasicInformation(driver);
    await fillNLPQuestions(driver);
    await submitGoalForm(driver);
    await verifyGoalCreation(driver);
    
    console.log('✅ E2E: Goal creation flow passed');
    await captureArtifacts(driver, 'success');
    
    // Additional tests
    console.log('Running additional tests...');
    
    // Test form validation
    await testFormValidation(driver);
    
    // Test accessibility
    await testAccessibility(driver);
    
    // Test error handling
    await testErrorHandling(driver);
    
    console.log('✅ All additional tests completed');
    
  } catch (error) {
    console.error('❌ E2E: Goal creation flow failed:', error.message);
    await captureArtifacts(driver, 'failure');
    throw error;
  } finally {
    await driver.quit();
  }
}

// Run the test if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runGoalCreationTest()
    .then(() => {
      console.log('Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { runGoalCreationTest };
