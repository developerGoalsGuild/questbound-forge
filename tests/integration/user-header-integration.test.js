/**
 * User Header Integration Tests
 * Tests header functionality across authenticated pages
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const { expect } = require('chai');
const chrome = require('selenium-webdriver/chrome');

describe('User Header Integration Tests', function() {
  let driver;
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5173';
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    fullName: 'Test User'
  };

  before(async function() {
    // Setup Chrome options
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // Set implicit wait
    await driver.manage().setTimeouts({ implicit: 10000 });
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  beforeEach(async function() {
    // Navigate to login page
    await driver.get(`${baseUrl}/login/Login`);
    
    // Wait for page to load
    await driver.wait(until.elementLocated(By.css('form')), 10000);
    
    // Login with test user
    await loginUser(testUser);
    
    // Wait for redirect to dashboard
    await driver.wait(until.urlContains('/dashboard'), 10000);
  });

  afterEach(async function() {
    // Logout after each test
    try {
      await logoutUser();
    } catch (error) {
      console.warn('Logout failed in afterEach:', error.message);
    }
  });

  describe('Header Display Tests', function() {
    it('should display header on all authenticated pages', async function() {
      const pages = [
        '/dashboard',
        '/goals',
        '/goals/create',
        '/profile',
        '/account/change-password'
      ];

      for (const page of pages) {
        await driver.get(`${baseUrl}${page}`);
        await driver.wait(until.elementLocated(By.css('[data-testid="user-header"]')), 5000);
        
        const header = await driver.findElement(By.css('[data-testid="user-header"]'));
        expect(await header.isDisplayed()).to.be.true;
      }
    });

    it('should display active goals count badge', async function() {
      const goalsBadge = await driver.findElement(By.css('[data-testid="active-goals-badge"]'));
      expect(await goalsBadge.isDisplayed()).to.be.true;
      
      // Check that it shows a number (or loading state)
      const badgeText = await goalsBadge.getText();
      expect(badgeText).to.match(/^\d+|Loading|\.\.\.$/);
    });

    it('should display user menu button', async function() {
      const userMenuButton = await driver.findElement(By.css('[data-testid="user-menu-trigger"]'));
      expect(await userMenuButton.isDisplayed()).to.be.true;
      
      // Check accessibility attributes
      const ariaExpanded = await userMenuButton.getAttribute('aria-expanded');
      const ariaHaspopup = await userMenuButton.getAttribute('aria-haspopup');
      expect(ariaExpanded).to.equal('false');
      expect(ariaHaspopup).to.equal('menu');
    });
  });

  describe('Goals Count Functionality Tests', function() {
    it('should update goals count when creating a new goal', async function() {
      // Get initial count
      const initialBadge = await driver.findElement(By.css('[data-testid="active-goals-badge"]'));
      const initialCount = parseInt(await initialBadge.getText()) || 0;

      // Navigate to create goal page
      await driver.get(`${baseUrl}/goals/create`);
      await driver.wait(until.elementLocated(By.css('form')), 5000);

      // Fill out goal form
      await createTestGoal({
        title: 'Test Goal for Count Update',
        description: 'This goal is created to test count updates',
        category: 'personal',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      // Wait for redirect and count update
      await driver.wait(until.urlContains('/goals'), 10000);
      
      // Wait for count to update (with retry mechanism)
      let updatedCount = initialCount;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        try {
          const updatedBadge = await driver.findElement(By.css('[data-testid="active-goals-badge"]'));
          updatedCount = parseInt(await updatedBadge.getText()) || 0;
          
          if (updatedCount > initialCount) {
            break;
          }
        } catch (error) {
          console.warn(`Attempt ${attempts + 1} failed to get updated count:`, error.message);
        }
        
        await driver.sleep(1000);
        attempts++;
      }

      expect(updatedCount).to.be.greaterThan(initialCount);
    });

    it('should update goals count when completing a goal', async function() {
      // First create a goal
      await driver.get(`${baseUrl}/goals/create`);
      await driver.wait(until.elementLocated(By.css('form')), 5000);

      const goalId = await createTestGoal({
        title: 'Test Goal for Completion',
        description: 'This goal will be completed to test count updates',
        category: 'personal',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      // Wait for redirect and get count after creation
      await driver.wait(until.urlContains('/goals'), 10000);
      await driver.sleep(2000); // Wait for count to update
      
      const badgeAfterCreation = await driver.findElement(By.css('[data-testid="active-goals-badge"]'));
      const countAfterCreation = parseInt(await badgeAfterCreation.getText()) || 0;

      // Navigate to goal details and complete it
      await driver.get(`${baseUrl}/goals/details/${goalId}`);
      await driver.wait(until.elementLocated(By.css('[data-testid="goal-details"]')), 5000);

      // Find and click complete button
      const completeButton = await driver.findElement(By.css('[data-testid="complete-goal-button"]'));
      await completeButton.click();

      // Wait for completion and count update
      await driver.sleep(2000);

      // Check that count decreased
      const badgeAfterCompletion = await driver.findElement(By.css('[data-testid="active-goals-badge"]'));
      const countAfterCompletion = parseInt(await badgeAfterCompletion.getText()) || 0;

      expect(countAfterCompletion).to.be.lessThan(countAfterCreation);
    });

    it('should show loading state during goals count fetch', async function() {
      // Navigate to a page and check for loading state
      await driver.get(`${baseUrl}/dashboard`);
      
      // The loading state might be very brief, so we check immediately
      const badge = await driver.findElement(By.css('[data-testid="active-goals-badge"]'));
      const badgeText = await badge.getText();
      
      // Should show either a number or loading state
      expect(badgeText).to.match(/^\d+|Loading|\.\.\.$/);
    });
  });

  describe('User Menu Navigation Tests', function() {
    it('should open user menu on click', async function() {
      const userMenuButton = await driver.findElement(By.css('[data-testid="user-menu-trigger"]'));
      await userMenuButton.click();

      // Wait for menu to appear
      await driver.wait(until.elementLocated(By.css('[data-testid="user-menu-content"]')), 5000);
      
      const menuContent = await driver.findElement(By.css('[data-testid="user-menu-content"]'));
      expect(await menuContent.isDisplayed()).to.be.true;

      // Check that aria-expanded is true
      const ariaExpanded = await userMenuButton.getAttribute('aria-expanded');
      expect(ariaExpanded).to.equal('true');
    });

    it('should navigate to profile edit page', async function() {
      await openUserMenu();
      
      const profileMenuItem = await driver.findElement(By.css('[data-testid="user-menu-profile"]'));
      await profileMenuItem.click();

      // Wait for navigation
      await driver.wait(until.urlContains('/profile/edit'), 10000);
      expect(await driver.getCurrentUrl()).to.include('/profile/edit');
    });

    it('should navigate to change password page', async function() {
      await openUserMenu();
      
      const passwordMenuItem = await driver.findElement(By.css('[data-testid="user-menu-change-password"]'));
      await passwordMenuItem.click();

      // Wait for navigation
      await driver.wait(until.urlContains('/account/change-password'), 10000);
      expect(await driver.getCurrentUrl()).to.include('/account/change-password');
    });

    it('should navigate to dashboard from menu', async function() {
      // Navigate to a different page first
      await driver.get(`${baseUrl}/goals`);
      await driver.wait(until.elementLocated(By.css('[data-testid="user-header"]')), 5000);

      await openUserMenu();
      
      const dashboardMenuItem = await driver.findElement(By.css('[data-testid="user-menu-dashboard"]'));
      await dashboardMenuItem.click();

      // Wait for navigation
      await driver.wait(until.urlContains('/dashboard'), 10000);
      expect(await driver.getCurrentUrl()).to.include('/dashboard');
    });

    it('should perform logout from menu', async function() {
      await openUserMenu();
      
      const logoutMenuItem = await driver.findElement(By.css('[data-testid="user-menu-logout"]'));
      await logoutMenuItem.click();

      // Wait for logout and redirect to login
      await driver.wait(until.urlContains('/login'), 10000);
      expect(await driver.getCurrentUrl()).to.include('/login');
    });
  });

  describe('Keyboard Navigation Tests', function() {
    it('should navigate menu items with arrow keys', async function() {
      const userMenuButton = await driver.findElement(By.css('[data-testid="user-menu-trigger"]'));
      await userMenuButton.click();

      // Wait for menu to appear
      await driver.wait(until.elementLocated(By.css('[data-testid="user-menu-content"]')), 5000);

      // Press down arrow key
      await userMenuButton.sendKeys(Key.ARROW_DOWN);
      
      // Check that first menu item is focused
      const firstMenuItem = await driver.findElement(By.css('[data-testid="user-menu-dashboard"]'));
      const isFocused = await driver.executeScript(
        'return document.activeElement === arguments[0]',
        firstMenuItem
      );
      expect(isFocused).to.be.true;
    });

    it('should close menu with escape key', async function() {
      await openUserMenu();
      
      // Press escape key
      const userMenuButton = await driver.findElement(By.css('[data-testid="user-menu-trigger"]'));
      await userMenuButton.sendKeys(Key.ESCAPE);

      // Wait for menu to close
      await driver.sleep(500);
      
      // Check that menu is closed
      const menuContent = await driver.findElements(By.css('[data-testid="user-menu-content"]'));
      expect(menuContent).to.have.lengthOf(0);
    });

    it('should activate menu item with enter key', async function() {
      await openUserMenu();
      
      // Navigate to profile item
      const userMenuButton = await driver.findElement(By.css('[data-testid="user-menu-trigger"]'));
      await userMenuButton.sendKeys(Key.ARROW_DOWN, Key.ARROW_DOWN);
      
      // Press enter
      await userMenuButton.sendKeys(Key.ENTER);

      // Wait for navigation
      await driver.wait(until.urlContains('/profile/edit'), 10000);
      expect(await driver.getCurrentUrl()).to.include('/profile/edit');
    });
  });

  describe('Responsive Design Tests', function() {
    it('should adapt to mobile screen size', async function() {
      // Set mobile viewport
      await driver.manage().window().setRect({ width: 375, height: 667 });
      
      await driver.get(`${baseUrl}/dashboard`);
      await driver.wait(until.elementLocated(By.css('[data-testid="user-header"]')), 5000);

      // Check that header is still visible
      const header = await driver.findElement(By.css('[data-testid="user-header"]'));
      expect(await header.isDisplayed()).to.be.true;

      // Check that user menu is still accessible
      const userMenuButton = await driver.findElement(By.css('[data-testid="user-menu-trigger"]'));
      expect(await userMenuButton.isDisplayed()).to.be.true;
    });

    it('should show appropriate content on tablet size', async function() {
      // Set tablet viewport
      await driver.manage().window().setRect({ width: 768, height: 1024 });
      
      await driver.get(`${baseUrl}/dashboard`);
      await driver.wait(until.elementLocated(By.css('[data-testid="user-header"]')), 5000);

      // Check that both goals count and user menu are visible
      const goalsBadge = await driver.findElement(By.css('[data-testid="active-goals-badge"]'));
      const userMenuButton = await driver.findElement(By.css('[data-testid="user-menu-trigger"]'));
      
      expect(await goalsBadge.isDisplayed()).to.be.true;
      expect(await userMenuButton.isDisplayed()).to.be.true;
    });
  });

  describe('Error Handling Tests', function() {
    it('should handle network errors gracefully', async function() {
      // Simulate network error by going offline
      await driver.executeScript('window.navigator.onLine = false');
      
      await driver.get(`${baseUrl}/dashboard`);
      await driver.wait(until.elementLocated(By.css('[data-testid="user-header"]')), 5000);

      // Check that header still displays with error state
      const header = await driver.findElement(By.css('[data-testid="user-header"]'));
      expect(await header.isDisplayed()).to.be.true;

      // Check that goals badge shows error state
      const goalsBadge = await driver.findElement(By.css('[data-testid="active-goals-badge"]'));
      const badgeText = await goalsBadge.getText();
      expect(badgeText).to.match(/Error|Failed|\.\.\./);
    });

    it('should recover from errors when network is restored', async function() {
      // Start offline
      await driver.executeScript('window.navigator.onLine = false');
      
      await driver.get(`${baseUrl}/dashboard`);
      await driver.wait(until.elementLocated(By.css('[data-testid="user-header"]')), 5000);

      // Restore network
      await driver.executeScript('window.navigator.onLine = true');
      
      // Wait for recovery
      await driver.sleep(3000);

      // Check that goals count is now showing a number
      const goalsBadge = await driver.findElement(By.css('[data-testid="active-goals-badge"]'));
      const badgeText = await goalsBadge.getText();
      expect(badgeText).to.match(/^\d+$/);
    });
  });

  // Helper functions
  async function loginUser(user) {
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));

    await emailInput.clear();
    await emailInput.sendKeys(user.email);
    await passwordInput.clear();
    await passwordInput.sendKeys(user.password);
    await loginButton.click();
  }

  async function logoutUser() {
    try {
      await openUserMenu();
      const logoutMenuItem = await driver.findElement(By.css('[data-testid="user-menu-logout"]'));
      await logoutMenuItem.click();
      await driver.wait(until.urlContains('/login'), 10000);
    } catch (error) {
      console.warn('Logout failed:', error.message);
    }
  }

  async function openUserMenu() {
    const userMenuButton = await driver.findElement(By.css('[data-testid="user-menu-trigger"]'));
    await userMenuButton.click();
    await driver.wait(until.elementLocated(By.css('[data-testid="user-menu-content"]')), 5000);
  }

  async function createTestGoal(goalData) {
    // Fill out the goal form
    const titleInput = await driver.findElement(By.css('input[name="title"]'));
    await titleInput.clear();
    await titleInput.sendKeys(goalData.title);

    const descriptionInput = await driver.findElement(By.css('textarea[name="description"]'));
    await descriptionInput.clear();
    await descriptionInput.sendKeys(goalData.description);

    const categorySelect = await driver.findElement(By.css('select[name="category"]'));
    await categorySelect.click();
    const categoryOption = await driver.findElement(By.css(`option[value="${goalData.category}"]`));
    await categoryOption.click();

    const deadlineInput = await driver.findElement(By.css('input[name="deadline"]'));
    await deadlineInput.clear();
    await deadlineInput.sendKeys(goalData.deadline);

    // Submit the form
    const submitButton = await driver.findElement(By.css('button[type="submit"]'));
    await submitButton.click();

    // Wait for redirect and extract goal ID from URL
    await driver.wait(until.urlContains('/goals'), 10000);
    const currentUrl = await driver.getCurrentUrl();
    const goalId = currentUrl.match(/\/goals\/(\w+)/)?.[1];
    
    return goalId;
  }
});
