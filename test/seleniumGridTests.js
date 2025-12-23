/**
 * Lightweight Selenium Grid runner that focuses on Level + Badge verification.
 *
 * Reuses the comprehensive helpers defined in
 * frontend/src/__tests__/selenium/gamification-selenium.test.cjs.
 */

const {
  createDriver,
  authenticateUser,
  navigateToProfile,
  testXPDisplay,
  testBadgeDisplay,
  testGoalTaskCreationWithXP,
  testBadgeAwarding,
} = require('../frontend/src/__tests__/selenium/gamification-selenium.test.cjs');

async function runScenario() {
  const driver = await createDriver();
  try {
    await authenticateUser(driver);
    await navigateToProfile(driver);
    await testXPDisplay(driver);
    await testBadgeDisplay(driver);
    await testGoalTaskCreationWithXP(driver);
    await testBadgeAwarding(driver);
    console.log('✅ Level & badge Selenium scenario completed successfully');
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

runScenario().catch((error) => {
  console.error('❌ Selenium Grid scenario failed:', error);
  process.exitCode = 1;
});

