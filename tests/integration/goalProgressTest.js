/**
 * Goal Progress Integration Test
 * Tests the complete goal progress visualization functionality including:
 * - Progress bar display and updates
 * - Milestone markers and achievement
 * - Task completion triggering progress updates
 * - Dual progress bar functionality
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:5173',
  timeout: 30000,
  implicitWait: 10000,
  testUser: {
    email: 'testuser@example.com',
    password: 'TestPassword123!'
  }
};

// Test data
const TEST_GOAL = {
  title: 'Test Goal Progress Visualization',
  description: 'A test goal to verify progress calculation and display',
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
  category: 'Testing'
};

const TEST_TASKS = [
  { title: 'Task 1 - To be completed', description: 'First test task' },
  { title: 'Task 2 - To remain active', description: 'Second test task' },
  { title: 'Task 3 - To be completed', description: 'Third test task' },
  { title: 'Task 4 - To remain active', description: 'Fourth test task' }
];

/**
 * Main test runner function
 */
async function runGoalProgressTest() {
  let driver;
  
  try {
    console.log('🚀 Starting Goal Progress Integration Test...');
    
    // Initialize WebDriver
    driver = await new Builder().forBrowser('chrome').build();
    await driver.manage().setTimeouts({ implicit: TEST_CONFIG.implicitWait });
    
    // Run test phases
    await loginUser(driver);
    await navigateToDashboard(driver);
    await verifyInitialProgressDisplay(driver);
    await createTestGoal(driver);
    await createTestTasks(driver);
    await verifyProgressAfterTaskCreation(driver);
    await completeTasksAndVerifyProgress(driver);
    await verifyMilestoneAchievement(driver);
    await verifyDualProgressBars(driver);
    await verifyGoalDetailsProgress(driver);
    await testProgressResponsiveness(driver);
    await cleanupTestData(driver);
    
    console.log('✅ Goal Progress Integration Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Goal Progress Integration Test failed:', error);
    
    // Take screenshot on failure
    if (driver) {
      try {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync(
          `tests/screenshots/goal-progress-test-failure-${Date.now()}.png`,
          screenshot,
          'base64'
        );
        console.log('📸 Screenshot saved for debugging');
      } catch (screenshotError) {
        console.error('Failed to take screenshot:', screenshotError);
      }
    }
    
    throw error;
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

/**
 * Login user for testing
 */
async function loginUser(driver) {
  console.log('🔐 Logging in test user...');
  
  await driver.get(`${TEST_CONFIG.baseUrl}/login`);
  
  // Wait for login form
  await driver.wait(until.elementLocated(By.css('input[type="email"]')), TEST_CONFIG.timeout);
  
  // Fill login form
  await driver.findElement(By.css('input[type="email"]')).sendKeys(TEST_USER.email);
  await driver.findElement(By.css('input[type="password"]')).sendKeys(TEST_USER.password);
  
  // Submit form
  await driver.findElement(By.css('button[type="submit"]')).click();
  
  // Wait for dashboard redirect
  await driver.wait(until.urlContains('/dashboard'), TEST_CONFIG.timeout);
  
  console.log('✅ User logged in successfully');
}

/**
 * Navigate to dashboard and verify initial state
 */
async function navigateToDashboard(driver) {
  console.log('🏠 Navigating to dashboard...');
  
  await driver.get(`${TEST_CONFIG.baseUrl}/dashboard`);
  
  // Wait for dashboard to load
  await driver.wait(until.elementLocated(By.css('[data-testid="user-dashboard"]')), TEST_CONFIG.timeout);
  
  console.log('✅ Dashboard loaded successfully');
}

/**
 * Verify initial progress display on dashboard
 */
async function verifyInitialProgressDisplay(driver) {
  console.log('📊 Verifying initial progress display...');
  
  // Check for progress metrics cards
  const progressCards = await driver.findElements(By.css('[data-testid="progress-card"]'));
  assert(progressCards.length >= 3, 'Should have at least 3 progress cards (overall, task, time)');
  
  // Verify progress card labels
  const overallCard = await driver.findElement(By.css('[data-testid="overall-progress-card"]'));
  const overallText = await overallCard.getText();
  assert(overallText.includes('Overall Progress'), 'Overall progress card should be present');
  
  const taskCard = await driver.findElement(By.css('[data-testid="task-progress-card"]'));
  const taskText = await taskCard.getText();
  assert(taskText.includes('Task Progress'), 'Task progress card should be present');
  
  const timeCard = await driver.findElement(By.css('[data-testid="time-progress-card"]'));
  const timeText = await timeCard.getText();
  assert(timeText.includes('Time Progress'), 'Time progress card should be present');
  
  console.log('✅ Initial progress display verified');
}

/**
 * Create a test goal for progress testing
 */
async function createTestGoal(driver) {
  console.log('🎯 Creating test goal...');
  
  // Navigate to goals page
  await driver.findElement(By.css('[data-testid="goals-button"]')).click();
  await driver.wait(until.urlContains('/goals'), TEST_CONFIG.timeout);
  
  // Click create goal button
  await driver.findElement(By.css('[data-testid="create-goal-button"]')).click();
  
  // Wait for create goal modal/form
  await driver.wait(until.elementLocated(By.css('[data-testid="goal-title-input"]')), TEST_CONFIG.timeout);
  
  // Fill goal form
  await driver.findElement(By.css('[data-testid="goal-title-input"]')).sendKeys(TEST_GOAL.title);
  await driver.findElement(By.css('[data-testid="goal-description-input"]')).sendKeys(TEST_GOAL.description);
  await driver.findElement(By.css('[data-testid="goal-deadline-input"]')).sendKeys(TEST_GOAL.deadline);
  
  // Submit goal creation
  await driver.findElement(By.css('[data-testid="create-goal-submit"]')).click();
  
  // Wait for goal to be created and redirect
  await driver.wait(until.elementLocated(By.css('[data-testid="goal-card"]')), TEST_CONFIG.timeout);
  
  console.log('✅ Test goal created successfully');
}

/**
 * Create test tasks for the goal
 */
async function createTestTasks(driver) {
  console.log('📝 Creating test tasks...');
  
  // Find and click on the test goal
  const goalCards = await driver.findElements(By.css('[data-testid="goal-card"]'));
  let testGoalCard = null;
  
  for (let card of goalCards) {
    const cardText = await card.getText();
    if (cardText.includes(TEST_GOAL.title)) {
      testGoalCard = card;
      break;
    }
  }
  
  assert(testGoalCard, 'Test goal card should be found');
  await testGoalCard.click();
  
  // Wait for goal details page
  await driver.wait(until.urlContains('/goals/'), TEST_CONFIG.timeout);
  
  // Create tasks
  for (let i = 0; i < TEST_TASKS.length; i++) {
    const task = TEST_TASKS[i];
    
    // Click add task button
    await driver.findElement(By.css('[data-testid="add-task-button"]')).click();
    
    // Wait for task creation modal
    await driver.wait(until.elementLocated(By.css('[data-testid="task-title-input"]')), TEST_CONFIG.timeout);
    
    // Fill task form
    await driver.findElement(By.css('[data-testid="task-title-input"]')).clear();
    await driver.findElement(By.css('[data-testid="task-title-input"]')).sendKeys(task.title);
    await driver.findElement(By.css('[data-testid="task-description-input"]')).clear();
    await driver.findElement(By.css('[data-testid="task-description-input"]')).sendKeys(task.description);
    
    // Submit task creation
    await driver.findElement(By.css('[data-testid="create-task-submit"]')).click();
    
    // Wait for task to be created
    await driver.sleep(1000); // Brief pause between task creations
  }
  
  console.log('✅ Test tasks created successfully');
}

/**
 * Verify progress display after task creation
 */
async function verifyProgressAfterTaskCreation(driver) {
  console.log('📈 Verifying progress after task creation...');
  
  // Check for dual progress bar component
  const dualProgressBar = await driver.findElement(By.css('[data-testid="dual-progress-bar"]'));
  assert(dualProgressBar, 'Dual progress bar should be present');
  
  // Verify overall progress bar
  const overallProgressBar = await driver.findElement(By.css('[data-testid="overall-progress-bar"]'));
  const overallProgress = await overallProgressBar.getAttribute('aria-valuenow');
  assert(parseInt(overallProgress) >= 0, 'Overall progress should be >= 0');
  
  // Verify task progress bar (should be 0% since no tasks completed)
  const taskProgressBar = await driver.findElement(By.css('[data-testid="task-progress-bar"]'));
  const taskProgress = await taskProgressBar.getAttribute('aria-valuenow');
  assert(parseInt(taskProgress) === 0, 'Task progress should be 0% initially');
  
  // Verify time progress bar (should be low since just created)
  const timeProgressBar = await driver.findElement(By.css('[data-testid="time-progress-bar"]'));
  const timeProgress = await timeProgressBar.getAttribute('aria-valuenow');
  assert(parseInt(timeProgress) < 10, 'Time progress should be low initially');
  
  // Verify task count display
  const taskCountElement = await driver.findElement(By.css('[data-testid="task-count-display"]'));
  const taskCountText = await taskCountElement.getText();
  assert(taskCountText.includes('0/4'), 'Should show 0 completed out of 4 total tasks');
  
  console.log('✅ Progress verified after task creation');
}

/**
 * Complete some tasks and verify progress updates
 */
async function completeTasksAndVerifyProgress(driver) {
  console.log('✅ Completing tasks and verifying progress updates...');
  
  // Find task items
  const taskItems = await driver.findElements(By.css('[data-testid="task-item"]'));
  assert(taskItems.length === 4, 'Should have 4 task items');
  
  // Complete first task
  await completeTask(driver, 0);
  await verifyProgressUpdate(driver, 1, 4); // 1 completed out of 4
  
  // Complete third task
  await completeTask(driver, 2);
  await verifyProgressUpdate(driver, 2, 4); // 2 completed out of 4
  
  console.log('✅ Task completion and progress updates verified');
}

/**
 * Complete a specific task by index
 */
async function completeTask(driver, taskIndex) {
  const taskItems = await driver.findElements(By.css('[data-testid="task-item"]'));
  const taskItem = taskItems[taskIndex];
  
  // Click on task to open details/edit
  await taskItem.click();
  
  // Wait for task edit modal
  await driver.wait(until.elementLocated(By.css('[data-testid="task-status-select"]')), TEST_CONFIG.timeout);
  
  // Change status to completed
  const statusSelect = await driver.findElement(By.css('[data-testid="task-status-select"]'));
  await statusSelect.click();
  
  const completedOption = await driver.findElement(By.css('[data-testid="status-completed"]'));
  await completedOption.click();
  
  // Save task
  await driver.findElement(By.css('[data-testid="save-task-button"]')).click();
  
  // Wait for modal to close
  await driver.wait(until.stalenessOf(await driver.findElement(By.css('[data-testid="task-edit-modal"]'))), TEST_CONFIG.timeout);
}

/**
 * Verify progress update after task completion
 */
async function verifyProgressUpdate(driver, completedTasks, totalTasks) {
  // Wait for progress to update (give it a moment for calculation)
  await driver.sleep(2000);
  
  // Verify task count display
  const taskCountElement = await driver.findElement(By.css('[data-testid="task-count-display"]'));
  const taskCountText = await taskCountElement.getText();
  assert(taskCountText.includes(`${completedTasks}/${totalTasks}`), 
    `Should show ${completedTasks} completed out of ${totalTasks} total tasks`);
  
  // Verify task progress percentage
  const expectedTaskProgress = Math.round((completedTasks / totalTasks) * 100);
  const taskProgressBar = await driver.findElement(By.css('[data-testid="task-progress-bar"]'));
  const taskProgress = await taskProgressBar.getAttribute('aria-valuenow');
  assert(Math.abs(parseInt(taskProgress) - expectedTaskProgress) <= 1, 
    `Task progress should be approximately ${expectedTaskProgress}%`);
  
  // Verify overall progress has increased
  const overallProgressBar = await driver.findElement(By.css('[data-testid="overall-progress-bar"]'));
  const overallProgress = await overallProgressBar.getAttribute('aria-valuenow');
  assert(parseInt(overallProgress) > 0, 'Overall progress should be greater than 0');
}

/**
 * Verify milestone achievement
 */
async function verifyMilestoneAchievement(driver) {
  console.log('🏆 Verifying milestone achievement...');
  
  // Check for milestone markers
  const milestoneMarkers = await driver.findElements(By.css('[data-testid="milestone-marker"]'));
  assert(milestoneMarkers.length === 4, 'Should have 4 milestone markers (25%, 50%, 75%, 100%)');
  
  // Check if any milestones are achieved (should have at least some progress)
  const achievedMilestones = await driver.findElements(By.css('[data-testid="milestone-achieved"]'));
  
  // With 2 out of 4 tasks completed, we should have some progress
  // Task progress: 50%, Time progress: ~0%, Overall: 50% * 0.7 + 0% * 0.3 = 35%
  // So we should have achieved the 25% milestone
  assert(achievedMilestones.length >= 1, 'Should have achieved at least the 25% milestone');
  
  console.log('✅ Milestone achievement verified');
}

/**
 * Verify dual progress bars functionality
 */
async function verifyDualProgressBars(driver) {
  console.log('📊 Verifying dual progress bars functionality...');
  
  // Verify both progress bars are present and have different values
  const overallProgressBar = await driver.findElement(By.css('[data-testid="overall-progress-bar"]'));
  const taskProgressBar = await driver.findElement(By.css('[data-testid="task-progress-bar"]'));
  const timeProgressBar = await driver.findElement(By.css('[data-testid="time-progress-bar"]'));
  
  const overallProgress = parseInt(await overallProgressBar.getAttribute('aria-valuenow'));
  const taskProgress = parseInt(await taskProgressBar.getAttribute('aria-valuenow'));
  const timeProgress = parseInt(await timeProgressBar.getAttribute('aria-valuenow'));
  
  // Verify task progress is 50% (2 out of 4 tasks completed)
  assert(Math.abs(taskProgress - 50) <= 2, 'Task progress should be approximately 50%');
  
  // Verify time progress is low (goal just created)
  assert(timeProgress < 10, 'Time progress should be low for newly created goal');
  
  // Verify overall progress is weighted combination
  const expectedOverall = Math.round((taskProgress * 0.7) + (timeProgress * 0.3));
  assert(Math.abs(overallProgress - expectedOverall) <= 2, 
    `Overall progress should be approximately ${expectedOverall}%`);
  
  console.log('✅ Dual progress bars functionality verified');
}

/**
 * Verify progress display on goal details page
 */
async function verifyGoalDetailsProgress(driver) {
  console.log('📋 Verifying goal details progress display...');
  
  // Should already be on goal details page
  const currentUrl = await driver.getCurrentUrl();
  assert(currentUrl.includes('/goals/'), 'Should be on goal details page');
  
  // Verify progress section is present
  const progressSection = await driver.findElement(By.css('[data-testid="progress-section"]'));
  assert(progressSection, 'Progress section should be present on goal details page');
  
  // Verify dual progress bar is displayed
  const dualProgressBar = await driver.findElement(By.css('[data-testid="dual-progress-bar"]'));
  assert(dualProgressBar, 'Dual progress bar should be present on goal details page');
  
  // Verify milestone information is displayed
  const milestoneInfo = await driver.findElement(By.css('[data-testid="milestone-info"]'));
  assert(milestoneInfo, 'Milestone information should be present');
  
  console.log('✅ Goal details progress display verified');
}

/**
 * Test progress bar responsiveness
 */
async function testProgressResponsiveness(driver) {
  console.log('📱 Testing progress bar responsiveness...');
  
  // Test different screen sizes
  const screenSizes = [
    { width: 1920, height: 1080, name: 'Desktop' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 375, height: 667, name: 'Mobile' }
  ];
  
  for (let size of screenSizes) {
    await driver.manage().window().setRect({ width: size.width, height: size.height });
    await driver.sleep(1000); // Allow time for responsive adjustments
    
    // Verify progress bars are still visible and functional
    const dualProgressBar = await driver.findElement(By.css('[data-testid="dual-progress-bar"]'));
    const isDisplayed = await dualProgressBar.isDisplayed();
    assert(isDisplayed, `Progress bars should be visible on ${size.name} screen size`);
    
    console.log(`✅ Progress bars responsive on ${size.name} (${size.width}x${size.height})`);
  }
  
  // Reset to desktop size
  await driver.manage().window().setRect({ width: 1920, height: 1080 });
}

/**
 * Clean up test data
 */
async function cleanupTestData(driver) {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Navigate back to goals list
    await driver.get(`${TEST_CONFIG.baseUrl}/goals`);
    
    // Find and delete the test goal
    const goalCards = await driver.findElements(By.css('[data-testid="goal-card"]'));
    
    for (let card of goalCards) {
      const cardText = await card.getText();
      if (cardText.includes(TEST_GOAL.title)) {
        // Click on goal options/menu
        const optionsButton = await card.findElement(By.css('[data-testid="goal-options-button"]'));
        await optionsButton.click();
        
        // Click delete option
        const deleteButton = await driver.findElement(By.css('[data-testid="delete-goal-button"]'));
        await deleteButton.click();
        
        // Confirm deletion
        const confirmButton = await driver.findElement(By.css('[data-testid="confirm-delete-button"]'));
        await confirmButton.click();
        
        break;
      }
    }
    
    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.warn('⚠️ Could not clean up test data:', error.message);
  }
}

/**
 * Verify accessibility features
 */
async function verifyAccessibility(driver) {
  console.log('♿ Verifying accessibility features...');
  
  // Check ARIA labels on progress bars
  const progressBars = await driver.findElements(By.css('[role="progressbar"]'));
  
  for (let bar of progressBars) {
    const ariaLabel = await bar.getAttribute('aria-label');
    const ariaValueNow = await bar.getAttribute('aria-valuenow');
    const ariaValueMin = await bar.getAttribute('aria-valuemin');
    const ariaValueMax = await bar.getAttribute('aria-valuemax');
    
    assert(ariaLabel, 'Progress bar should have aria-label');
    assert(ariaValueNow !== null, 'Progress bar should have aria-valuenow');
    assert(ariaValueMin === '0', 'Progress bar should have aria-valuemin="0"');
    assert(ariaValueMax === '100', 'Progress bar should have aria-valuemax="100"');
  }
  
  // Check color contrast (basic check for color-coded progress)
  const progressElements = await driver.findElements(By.css('[data-testid*="progress"]'));
  
  for (let element of progressElements) {
    const backgroundColor = await driver.executeScript(
      'return window.getComputedStyle(arguments[0]).backgroundColor;',
      element
    );
    
    // Ensure background color is set (not transparent)
    assert(backgroundColor !== 'rgba(0, 0, 0, 0)', 'Progress elements should have visible background colors');
  }
  
  console.log('✅ Accessibility features verified');
}

// Export for use in test runner
module.exports = {
  runGoalProgressTest,
  TEST_CONFIG
};

// Run test if called directly
if (require.main === module) {
  runGoalProgressTest()
    .then(() => {
      console.log('🎉 All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}
