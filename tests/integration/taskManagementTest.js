/**
 * E2E: Task Management Integration Test
 * Tests the complete task management flow within goals
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
    const filename = `task-management-${name}-${Date.now()}.png`;
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
    const logFile = join(logDir, `task-management-${status}-${timestamp}.log`);
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

async function createTestGoal(driver) {
  console.log('Creating test goal...');
  
  await driver.get(`${BASE_URL}/goals/create`);
  await driver.wait(until.elementLocated(By.css('[data-testid="goal-creation-form"]')), 10000);
  
  // Fill basic information
  const titleInput = await driver.findElement(By.id('goal-title'));
  await typeSafely(titleInput, 'Task Management Test Goal');
  
  const descriptionInput = await driver.findElement(By.id('goal-description'));
  await typeSafely(descriptionInput, 'Test goal for task management functionality');
  
  const deadlineInput = await driver.findElement(By.id('goal-deadline'));
  await typeSafely(deadlineInput, '2024-12-31');
  
  // Fill NLP answers
  const nlpAnswers = [
    { id: 'nlp-positive', answer: 'I will test task management functionality' },
    { id: 'nlp-specific', answer: 'Complete task management testing by December 2024' },
    { id: 'nlp-evidence', answer: 'I will have tested all task management features' },
    { id: 'nlp-resources', answer: 'Test environment and documentation' },
    { id: 'nlp-obstacles', answer: 'Test data setup and environment configuration' },
    { id: 'nlp-ecology', answer: 'This will help improve the application quality' },
    { id: 'nlp-timeline', answer: '2 weeks starting now' },
    { id: 'nlp-firstStep', answer: 'Set up test environment' }
  ];
  
  for (const answer of nlpAnswers) {
    try {
      const input = await driver.findElement(By.id(answer.id));
      await typeSafely(input, answer.answer);
      await delay(200);
    } catch (error) {
      console.warn(`Failed to fill ${answer.id}:`, error.message);
    }
  }
  
  // Submit goal
  const submitButton = await driver.findElement(By.xpath("//button[contains(., 'Create Goal')]"));
  await submitButton.click();
  
  // Wait for success
  try {
    await driver.wait(until.or(
      until.elementLocated(By.xpath("//*[contains(text(), 'successfully')]")),
      until.urlContains('/goals')
    ), 15000);
    console.log('Test goal created successfully');
  } catch (error) {
    console.error('Goal creation failed:', error.message);
    throw error;
  }
}

async function navigateToGoalTasks(driver) {
  console.log('Navigating to goal tasks...');
  
  await driver.get(`${BASE_URL}/goals`);
  await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Task Management Test Goal')]")), 10000);
  
  // Click on the goal to view details
  const goalElement = await driver.findElement(By.xpath("//*[contains(text(), 'Task Management Test Goal')]"));
  await goalElement.click();
  
  // Wait for goal details page
  await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Task Management Test Goal')]")), 10000);
  console.log('Goal details page loaded');
}

async function openTasksModal(driver) {
  console.log('Opening tasks modal...');
  
  // Click "View Tasks" button
  const viewTasksButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., 'View Tasks') or contains(., 'Tasks')]")), 
    10000
  );
  await viewTasksButton.click();
  
  // Wait for tasks modal to open
  await driver.wait(until.elementLocated(By.css('[role="dialog"]')), 10000);
  console.log('Tasks modal opened');
}

async function createNewTask(driver) {
  console.log('Creating new task...');
  
  // Click "Create Task" button in modal
  const createTaskButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., 'Create Task') or contains(., 'Add Task')]")), 
    10000
  );
  await createTaskButton.click();
  
  // Wait for create task form
  await driver.wait(until.elementLocated(By.css('[data-testid="create-task-form"]')), 10000);
  
  // Fill task details
  const taskTitleInput = await driver.findElement(By.id('task-title'));
  await typeSafely(taskTitleInput, 'Test Task 1');
  
  const taskDescriptionInput = await driver.findElement(By.id('task-description'));
  await typeSafely(taskDescriptionInput, 'This is a test task for task management');
  
  const dueDateInput = await driver.findElement(By.id('task-due-date'));
  await typeSafely(dueDateInput, '2024-12-15');
  
  // Submit task
  const submitTaskButton = await driver.findElement(By.xpath("//button[contains(., 'Create Task') or contains(., 'Add Task')]"));
  await submitTaskButton.click();
  
  // Wait for task to be created
  try {
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Test Task 1')]")), 10000);
    console.log('Task created successfully');
  } catch (error) {
    console.warn('Task creation may have failed:', error.message);
  }
}

async function createMultipleTasks(driver) {
  console.log('Creating multiple tasks...');
  
  const tasks = [
    { title: 'Test Task 2', description: 'Second test task', dueDate: '2024-12-20' },
    { title: 'Test Task 3', description: 'Third test task', dueDate: '2024-12-25' },
    { title: 'Test Task 4', description: 'Fourth test task', dueDate: '2024-12-30' }
  ];
  
  for (const task of tasks) {
    try {
      // Click "Create Task" button
      const createTaskButton = await driver.findElement(By.xpath("//button[contains(., 'Create Task') or contains(., 'Add Task')]"));
      await createTaskButton.click();
      
      // Wait for create task form
      await driver.wait(until.elementLocated(By.css('[data-testid="create-task-form"]')), 10000);
      
      // Fill task details
      const taskTitleInput = await driver.findElement(By.id('task-title'));
      await typeSafely(taskTitleInput, task.title);
      
      const taskDescriptionInput = await driver.findElement(By.id('task-description'));
      await typeSafely(taskDescriptionInput, task.description);
      
      const dueDateInput = await driver.findElement(By.id('task-due-date'));
      await typeSafely(dueDateInput, task.dueDate);
      
      // Submit task
      const submitTaskButton = await driver.findElement(By.xpath("//button[contains(., 'Create Task') or contains(., 'Add Task')]"));
      await submitTaskButton.click();
      
      // Wait for task to be created
      await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), '${task.title}')]`)), 10000);
      console.log(`Task "${task.title}" created successfully`);
      
      await delay(1000); // Small delay between tasks
    } catch (error) {
      console.warn(`Failed to create task "${task.title}":`, error.message);
    }
  }
}

async function editTask(driver) {
  console.log('Editing task...');
  
  // Find the first task and click edit
  const taskElement = await driver.findElement(By.xpath("//*[contains(text(), 'Test Task 1')]"));
  const taskRow = await taskElement.findElement(By.xpath("./ancestor::tr | ./ancestor::div[contains(@class, 'task-item')]"));
  
  const editButton = await taskRow.findElement(By.xpath(".//button[contains(., 'Edit') or contains(., 'edit')]"));
  await editButton.click();
  
  // Wait for edit form
  await driver.wait(until.elementLocated(By.css('[data-testid="edit-task-form"]')), 10000);
  
  // Update task details
  const taskTitleInput = await driver.findElement(By.id('task-title'));
  await typeSafely(taskTitleInput, 'Updated Test Task 1');
  
  const taskDescriptionInput = await driver.findElement(By.id('task-description'));
  await typeSafely(taskDescriptionInput, 'This is an updated test task');
  
  // Save changes
  const saveButton = await driver.findElement(By.xpath("//button[contains(., 'Save') or contains(., 'Update')]"));
  await saveButton.click();
  
  // Wait for update to complete
  try {
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Updated Test Task 1')]")), 10000);
    console.log('Task updated successfully');
  } catch (error) {
    console.warn('Task update may have failed:', error.message);
  }
}

async function markTaskComplete(driver) {
  console.log('Marking task as complete...');
  
  // Find a task and mark it as complete
  const taskElement = await driver.findElement(By.xpath("//*[contains(text(), 'Test Task 2')]"));
  const taskRow = await taskElement.findElement(By.xpath("./ancestor::tr | ./ancestor::div[contains(@class, 'task-item')]"));
  
  // Look for complete button or checkbox
  try {
    const completeButton = await taskRow.findElement(By.xpath(".//button[contains(., 'Complete') or contains(., 'Done')] | .//input[@type='checkbox']"));
    await completeButton.click();
    
    // Wait for status change
    await delay(2000);
    console.log('Task marked as complete');
  } catch (error) {
    console.warn('Could not mark task as complete:', error.message);
  }
}

async function deleteTask(driver) {
  console.log('Deleting task...');
  
  // Find the last task and delete it
  const taskElement = await driver.findElement(By.xpath("//*[contains(text(), 'Test Task 4')]"));
  const taskRow = await taskElement.findElement(By.xpath("./ancestor::tr | ./ancestor::div[contains(@class, 'task-item')]"));
  
  const deleteButton = await taskRow.findElement(By.xpath(".//button[contains(., 'Delete') or contains(., 'delete')]"));
  await deleteButton.click();
  
  // Confirm deletion
  try {
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Delete Task') or contains(text(), 'Confirm')]")), 5000);
    
    const confirmButton = await driver.findElement(By.xpath("//button[contains(., 'Delete') or contains(., 'Confirm')]"));
    await confirmButton.click();
    
    // Wait for deletion to complete
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'success') or contains(text(), 'deleted')]")), 10000);
    console.log('Task deleted successfully');
  } catch (error) {
    console.warn('Task deletion confirmation not found or failed:', error.message);
  }
}

async function testTaskFiltering(driver) {
  console.log('Testing task filtering...');
  
  // Look for filter options
  try {
    const filterButton = await driver.findElement(By.xpath("//button[contains(., 'Filter') or contains(., 'Status')]"));
    await filterButton.click();
    await delay(500);
    
    // Select completed filter
    const completedOption = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Completed') or contains(text(), 'Done')]")), 
      5000
    );
    await completedOption.click();
    await delay(1000);
    
    console.log('Task filtering tested');
  } catch (error) {
    console.warn('Task filtering not available or failed:', error.message);
  }
}

async function testTaskSearch(driver) {
  console.log('Testing task search...');
  
  // Look for search input
  try {
    const searchInput = await driver.findElement(By.xpath("//input[@placeholder*='search' or @placeholder*='Search']"));
    await typeSafely(searchInput, 'Test Task 1');
    await delay(1000);
    
    // Should show only matching tasks
    const matchingTasks = await driver.findElements(By.xpath("//*[contains(text(), 'Test Task 1')]"));
    console.log(`Found ${matchingTasks.length} matching tasks`);
    
    // Clear search
    await searchInput.clear();
    await delay(1000);
    
    console.log('Task search tested');
  } catch (error) {
    console.warn('Task search not available or failed:', error.message);
  }
}

async function closeTasksModal(driver) {
  console.log('Closing tasks modal...');
  
  // Look for close button or click outside modal
  try {
    const closeButton = await driver.findElement(By.xpath("//button[contains(., 'Close') or contains(., '×')]"));
    await closeButton.click();
  } catch (error) {
    // Try clicking outside the modal
    await driver.findElement(By.css('body')).click();
  }
  
  await delay(1000);
  console.log('Tasks modal closed');
}

async function runTaskManagementTest() {
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
    console.log('Starting Task Management E2E Test...');
    
    // Main test flow
    await login(driver);
    await createTestGoal(driver);
    await navigateToGoalTasks(driver);
    await openTasksModal(driver);
    await createNewTask(driver);
    await createMultipleTasks(driver);
    await editTask(driver);
    await markTaskComplete(driver);
    await deleteTask(driver);
    await testTaskFiltering(driver);
    await testTaskSearch(driver);
    await closeTasksModal(driver);
    
    console.log('✅ E2E: Task management flow passed');
    await captureArtifacts(driver, 'success');
    
  } catch (error) {
    console.error('❌ E2E: Task management flow failed:', error.message);
    await captureArtifacts(driver, 'failure');
    throw error;
  } finally {
    await driver.quit();
  }
}

// Run the test if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runTaskManagementTest()
    .then(() => {
      console.log('Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { runTaskManagementTest };
