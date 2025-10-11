import { test, expect } from '@playwright/test';

// Environment variables for authentication
const API_GATEWAY_URL = process.env.VITE_API_GATEWAY_URL || 'https://api.goalsguild.com';
const API_GATEWAY_KEY = process.env.VITE_API_GATEWAY_KEY || '';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '';

test.describe('Quest Analytics Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for login form to be visible
    await page.waitForSelector('form');
    
    // Fill in login credentials
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test('should display analytics dashboard with data', async ({ page }) => {
    // Navigate to quest dashboard
    await page.goto('/quests');
    
    // Wait for analytics dashboard to load
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 10000 });
    
    // Check that analytics title is visible
    await expect(page.locator('text=Analytics')).toBeVisible();
    
    // Check that key metrics are displayed
    await expect(page.locator('text=Total Quests')).toBeVisible();
    await expect(page.locator('text=Success Rate')).toBeVisible();
    await expect(page.locator('text=Best Streak')).toBeVisible();
    await expect(page.locator('text=XP Earned')).toBeVisible();
  });

  test('should allow period selection', async ({ page }) => {
    await page.goto('/quests');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // Click on period selector
    await page.click('[role="combobox"]');
    
    // Select different period
    await page.click('text=Daily');
    
    // Wait for analytics to update
    await page.waitForTimeout(2000);
    
    // Verify period changed (check for daily-specific content)
    await expect(page.locator('text=Daily')).toBeVisible();
  });

  test('should display trend charts', async ({ page }) => {
    await page.goto('/quests');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // Check that trend chart is visible
    await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
    
    // Check that category performance chart is visible
    await expect(page.locator('[data-testid="category-chart"]')).toBeVisible();
    
    // Check that productivity heatmap is visible
    await expect(page.locator('[data-testid="productivity-heatmap"]')).toBeVisible();
  });

  test('should display insights cards', async ({ page }) => {
    await page.goto('/quests');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // Check that insights are displayed
    await expect(page.locator('[data-testid="insight-cards"]')).toBeVisible();
    
    // Check for specific insight content
    await expect(page.locator('text=Overall Performance')).toBeVisible();
  });

  test('should handle refresh functionality', async ({ page }) => {
    await page.goto('/quests');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // Click refresh button
    await page.click('button[aria-label="Refresh"]');
    
    // Wait for refresh to complete
    await page.waitForTimeout(3000);
    
    // Verify analytics are still displayed
    await expect(page.locator('text=Total Quests')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/quests/analytics*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/quests');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // Check that error message is displayed
    await expect(page.locator('text=Internal Server Error')).toBeVisible();
    
    // Check that retry button is available
    await expect(page.locator('text=Retry')).toBeVisible();
  });

  test('should work with different languages', async ({ page }) => {
    await page.goto('/quests');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // Switch to Spanish
    await page.click('button[aria-label="Language"]');
    await page.click('text=Español');
    
    // Wait for language change
    await page.waitForTimeout(1000);
    
    // Check that Spanish text is displayed
    await expect(page.locator('text=Análisis de Misiones')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/quests');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // Check that analytics are still visible on mobile
    await expect(page.locator('text=Analytics')).toBeVisible();
    
    // Check that charts are responsive
    await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
  });

  test('should cache analytics data', async ({ page }) => {
    await page.goto('/quests');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Navigate away and back
    await page.goto('/dashboard');
    await page.goto('/quests');
    
    // Analytics should load faster from cache
    await page.waitForSelector('[data-testid="analytics-dashboard"]', { timeout: 5000 });
    
    // Verify analytics are still displayed
    await expect(page.locator('text=Total Quests')).toBeVisible();
  });

  test('should update analytics when quests change', async ({ page }) => {
    await page.goto('/quests');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // Get initial analytics data
    const initialTotalQuests = await page.locator('text=Total Quests').textContent();
    
    // Create a new quest
    await page.click('text=Create Quest');
    await page.fill('input[name="title"]', 'Test Quest for Analytics');
    await page.selectOption('select[name="category"]', 'Health');
    await page.selectOption('select[name="difficulty"]', 'medium');
    await page.click('button[type="submit"]');
    
    // Wait for quest creation
    await page.waitForTimeout(2000);
    
    // Go back to quest dashboard
    await page.goto('/quests');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // Analytics should reflect the new quest
    await page.waitForTimeout(3000);
    const updatedTotalQuests = await page.locator('text=Total Quests').textContent();
    
    // The total should have increased
    expect(updatedTotalQuests).not.toBe(initialTotalQuests);
  });
});

test.describe('Quest Analytics API Integration', () => {
  test('should fetch analytics data from API', async ({ request }) => {
    // This test requires authentication token
    const authResponse = await request.post(`${API_GATEWAY_URL}/auth/login`, {
      data: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      }
    });
    
    expect(authResponse.ok()).toBeTruthy();
    const authData = await authResponse.json();
    const token = authData.token;
    
    // Test analytics API endpoint
    const analyticsResponse = await request.get(`${API_GATEWAY_URL}/quests/analytics?period=weekly`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_GATEWAY_KEY
      }
    });
    
    expect(analyticsResponse.ok()).toBeTruthy();
    const analyticsData = await analyticsResponse.json();
    
    // Verify response structure
    expect(analyticsData).toHaveProperty('userId');
    expect(analyticsData).toHaveProperty('period');
    expect(analyticsData).toHaveProperty('totalQuests');
    expect(analyticsData).toHaveProperty('completedQuests');
    expect(analyticsData).toHaveProperty('successRate');
    expect(analyticsData).toHaveProperty('trends');
    expect(analyticsData).toHaveProperty('categoryPerformance');
    expect(analyticsData).toHaveProperty('productivityByHour');
  });

  test('should handle different analytics periods', async ({ request }) => {
    const authResponse = await request.post(`${API_GATEWAY_URL}/auth/login`, {
      data: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      }
    });
    
    const authData = await authResponse.json();
    const token = authData.token;
    
    const periods = ['daily', 'weekly', 'monthly', 'allTime'];
    
    for (const period of periods) {
      const response = await request.get(`${API_GATEWAY_URL}/quests/analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': API_GATEWAY_KEY
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.period).toBe(period);
    }
  });

  test('should handle force refresh parameter', async ({ request }) => {
    const authResponse = await request.post(`${API_GATEWAY_URL}/auth/login`, {
      data: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      }
    });
    
    const authData = await authResponse.json();
    const token = authData.token;
    
    // Test with force refresh
    const response = await request.get(`${API_GATEWAY_URL}/quests/analytics?period=weekly&force_refresh=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_GATEWAY_KEY
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('calculatedAt');
  });
});
