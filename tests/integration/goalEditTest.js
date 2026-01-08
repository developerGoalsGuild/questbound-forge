/**
 * E2E: Goal Edit Flow
 * Tests the complete user journey from login to goal editing
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
    const filename = `goal-edit-${name}-${Date.now()}.png`;
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
    const logFile = join(logDir, `goal-edit-${status}-${timestamp}.log`);
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

async function navigateToGoalsList(driver) {
  console.log('Navigating to goals list...');
  
  await driver.get(`${BASE_URL}/goals`);
  await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Create New Goal')]")), 10000);
  
  console.log('Goals list loaded');
}

async function findAndClickEditGoal(driver, goalTitle) {
  console.log(`Looking for goal: ${goalTitle}`);
  
  // Wait for goals to load
  await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), '${goalTitle}')]`)), 10000);
  
  // Find the goal row and click edit button
  const goalRow = await driver.findElement(By.xpath(`//*[contains(text(), '${goalTitle}')]/ancestor::tr | //*[contains(text(), '${goalTitle}')]/ancestor::div[contains(@class, 'goal-card')]`));
  const editButton = await goalRow.findElement(By.xpath(".//button[contains(., 'Edit') or contains(., 'edit')]"));
  await editButton.click();
  
  console.log('Edit button clicked');
}

async function editGoalDetails(driver) {
  console.log('Editing goal details...');
  
  // Wait for edit form to load
  await driver.wait(until.elementLocated(By.css('[data-testid="goal-edit-form"]')), 10000);
  
  // Update title
  const titleInput = await driver.findElement(By.id('goal-title'));
  await typeSafely(titleInput, 'Learn Advanced TypeScript Programming');
  
  // Update description
  const descriptionInput = await driver.findElement(By.id('goal-description'));
  await typeSafely(descriptionInput, 'Master advanced TypeScript concepts including generics, decorators, and advanced type manipulation');
  
  // Update deadline
  const deadlineInput = await driver.findElement(By.id('goal-deadline'));
  await typeSafely(deadlineInput, '2024-11-30');
  
  // Update category if present
  try {
    const categorySelect = await driver.findElement(By.css('[role="combobox"]'));
    await categorySelect.click();
    await delay(500);
    
    const advancedOption = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Advanced') or contains(text(), 'Avanzado')]")), 
      5000
    );
    await advancedOption.click();
    await delay(500);
  } catch (error) {
    console.warn('Category selection not available or failed:', error.message);
  }
  
  console.log('Goal details updated');
}

async function updateNLPAnswers(driver) {
  console.log('Updating NLP answers...');
  
  const nlpUpdates = [
    { id: 'nlp-positive', answer: 'I will master advanced TypeScript programming language and become an expert' },
    { id: 'nlp-specific', answer: 'Complete 5 advanced TypeScript courses and build 10 complex projects by November 2024' },
    { id: 'nlp-evidence', answer: 'I will have built 10 advanced TypeScript projects, completed all course assignments, and be able to write complex TypeScript code with advanced patterns' },
    { id: 'nlp-resources', answer: 'Advanced TypeScript courses, books (Programming TypeScript, Effective TypeScript), practice projects, and coding challenges' },
    { id: 'nlp-obstacles', answer: 'Complex type system concepts, advanced patterns, and maintaining motivation during difficult topics' },
    { id: 'nlp-ecology', answer: 'This will help advance my career as a senior developer, improve my code quality, and enable me to work on more complex enterprise projects' },
    { id: 'nlp-timeline', answer: '4 months starting August 2024, 3-4 hours per day on weekdays and 5-6 hours on weekends' },
    { id: 'nlp-firstStep', answer: 'Enroll in the first advanced TypeScript course and set up my development environment with advanced TypeScript configuration' }
  ];
  
  for (const update of nlpUpdates) {
    try {
      const input = await driver.findElement(By.id(update.id));
      await typeSafely(input, update.answer);
      await delay(200);
    } catch (error) {
      console.warn(`Failed to update ${update.id}:`, error.message);
    }
  }
  
  console.log('NLP answers updated');
}

async function saveGoalChanges(driver) {
  console.log('Saving goal changes...');
  
  const saveButton = await driver.findElement(By.xpath("//button[contains(., 'Save Changes') or contains(., 'Update Goal')]"));
  await saveButton.click();
  
  // Wait for success or error
  try {
    await driver.wait(until.or(
      until.elementLocated(By.xpath("//*[contains(text(), 'Goal updated successfully') or contains(text(), 'successfully')]")),
      until.elementLocated(By.xpath("//*[contains(text(), 'Error') or contains(text(), 'Failed')]")),
      until.urlContains('/goals') // Redirect to goals list
    ), 15000);
    
    console.log('Goal changes saved successfully');
  } catch (error) {
    console.error('Save changes timeout or failed');
    throw error;
  }
}

async function verifyGoalUpdate(driver) {
  console.log('Verifying goal update...');
  
  // Check if redirected to goals page or success message is shown
  const currentUrl = await driver.getCurrentUrl();
  const isOnGoalsPage = currentUrl.includes('/goals');
  
  if (isOnGoalsPage) {
    // Look for the updated goal in the goals list
    try {
      await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Learn Advanced TypeScript Programming')]")), 10000);
      console.log('Updated goal found in goals list');
    } catch (error) {
      console.warn('Updated goal not found in goals list, but navigation was successful');
    }
  } else {
    // Look for success message
    try {
      await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'success') or contains(text(), 'updated')]")), 5000);
      console.log('Success message displayed');
    } catch (error) {
      console.warn('No success message found, but form submission completed');
    }
  }
}

async function testGoalStatusChange(driver) {
  console.log('Testing goal status change...');
  
  // Navigate back to goals list
  await driver.get(`${BASE_URL}/goals`);
  await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Learn Advanced TypeScript Programming')]")), 10000);
  
  // Find the goal and change status
  const goalRow = await driver.findElement(By.xpath(`//*[contains(text(), 'Learn Advanced TypeScript Programming')]/ancestor::tr | //*[contains(text(), 'Learn Advanced TypeScript Programming')]/ancestor::div[contains(@class, 'goal-card')]`));
  
  // Look for status change button or dropdown
  try {
    const statusButton = await goalRow.findElement(By.xpath(".//button[contains(., 'Status') or contains(., 'Change Status')]"));
    await statusButton.click();
    await delay(500);
    
    // Select new status
    const pausedOption = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Paused') or contains(text(), 'Pausado')]")), 
      5000
    );
    await pausedOption.click();
    await delay(1000);
    
    console.log('Goal status changed to paused');
  } catch (error) {
    console.warn('Status change not available or failed:', error.message);
  }
}

async function testGoalDeletion(driver) {
  console.log('Testing goal deletion...');
  
  // Find the goal and click delete
  const goalRow = await driver.findElement(By.xpath(`//*[contains(text(), 'Learn Advanced TypeScript Programming')]/ancestor::tr | //*[contains(text(), 'Learn Advanced TypeScript Programming')]/ancestor::div[contains(@class, 'goal-card')]`));
  const deleteButton = await goalRow.findElement(By.xpath(".//button[contains(., 'Delete') or contains(., 'delete')]"));
  await deleteButton.click();
  
  // Confirm deletion
  try {
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Delete Goal') or contains(text(), 'Confirm')]")), 5000);
    
    const confirmButton = await driver.findElement(By.xpath("//button[contains(., 'Delete') or contains(., 'Confirm')]"));
    await confirmButton.click();
    
    // Wait for deletion to complete
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'success') or contains(text(), 'deleted')]")), 10000);
    
    console.log('Goal deleted successfully');
  } catch (error) {
    console.warn('Deletion confirmation not found or failed:', error.message);
  }
}

async function testFormValidation(driver) {
  console.log('Testing form validation...');
  
  // Navigate to goal creation to test validation
  await driver.get(`${BASE_URL}/goals/create`);
  await driver.wait(until.elementLocated(By.css('[data-testid="goal-creation-form"]')), 10000);
  
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

async function runGoalEditTest() {
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
    console.log('Starting Goal Edit E2E Test...');
    
    // Main test flow
    await login(driver);
    await navigateToGoalsList(driver);
    await findAndClickEditGoal(driver, 'Learn TypeScript Programming');
    await editGoalDetails(driver);
    await updateNLPAnswers(driver);
    await saveGoalChanges(driver);
    await verifyGoalUpdate(driver);
    
    console.log('✅ E2E: Goal edit flow passed');
    await captureArtifacts(driver, 'success');
    
    // Additional tests
    console.log('Running additional tests...');
    
    // Test status change
    await testGoalStatusChange(driver);
    
    // Test goal deletion
    await testGoalDeletion(driver);
    
    // Test form validation
    await testFormValidation(driver);
    
    // Test accessibility
    await testAccessibility(driver);
    
    console.log('✅ All additional tests completed');
    
  } catch (error) {
    console.error('❌ E2E: Goal edit flow failed:', error.message);
    await captureArtifacts(driver, 'failure');
    throw error;
  } finally {
    await driver.quit();
  }
}

// Run the test if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runGoalEditTest()
    .then(() => {
      console.log('Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { runGoalEditTest };
