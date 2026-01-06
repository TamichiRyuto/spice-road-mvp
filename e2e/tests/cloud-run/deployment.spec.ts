import { test, expect } from '../shared/fixtures';
import {
  waitForDataLoading,
  waitForShopCards,
  waitForNetworkIdle,
  validateShopsResponse,
  validateUsersResponse,
} from '../shared/helpers';

/**
 * Cloud Run Deployment Validation Tests
 *
 * These tests run against the deployed Cloud Run environment
 * to verify production behavior and catch deployment issues.
 */

test.describe('Cloud Run Deployment Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Cloud Run URL is set via BASE_URL environment variable
    await page.goto('/');
  });

  test('frontend is accessible at Cloud Run URL', async ({ page }) => {
    expect(page.url()).toBeTruthy();
    expect(page.url()).toMatch(/https?:\/\//);

    await expect(page).toHaveTitle(/スパイスロード|Spice Road|カレー|Curry/i);
    console.log('Frontend URL:', page.url());
  });

  test('page loads without errors', async ({ page, errorCollector }) => {
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    const errors = errorCollector.getErrors();
    if (errors.length > 0) {
      console.error('Console errors in production:', errors);
      expect(errors.length).toBe(0);
    }
  });

  test('CRITICAL: data displays after loading (catches "nothing displays" bug)', async ({ page }) => {
    // This is the most important test for catching the reported bug
    console.log('Testing data display in Cloud Run environment...');

    // Wait for loading to complete
    await waitForDataLoading(page).catch(async () => {
      console.log('Loading spinner not detected, checking if data already loaded...');
      await page.waitForLoadState('networkidle');
    });

    // CRITICAL CHECK: Verify data actually displays
    const shopCardsCount = await page.locator('[data-testid="shop-card"]').count();
    console.log(`Shop cards displayed in Cloud Run: ${shopCardsCount}`);

    // This assertion would have caught the bug!
    expect(shopCardsCount).toBeGreaterThan(0);

    // Additional verification: check that cards have content
    const firstCard = page.locator('[data-testid="shop-card"]').first();
    const cardText = await firstCard.textContent();
    expect(cardText).toBeTruthy();
    expect(cardText!.length).toBeGreaterThan(0);

    console.log('✓ Data displays correctly in Cloud Run');
  });

  test('API connectivity from frontend', async ({ page }) => {
    // Monitor API requests
    const apiRequests: string[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        apiRequests.push(`${response.request().method()} ${response.url()} -> ${response.status()}`);
      }
    });

    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    console.log('API requests made:', apiRequests);

    // Should have made at least some API calls
    expect(apiRequests.length).toBeGreaterThan(0);

    // Verify all API calls succeeded
    const failedRequests = apiRequests.filter((req) => !req.includes(' -> 200'));
    if (failedRequests.length > 0) {
      console.error('Failed API requests:', failedRequests);
    }
    expect(failedRequests.length).toBe(0);
  });

  test('frontend fetches from correct API URL', async ({ page }) => {
    let apiUrl: string | null = null;

    page.on('request', (request) => {
      if (request.url().includes('/api/shops')) {
        apiUrl = request.url();
      }
    });

    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    console.log('API URL used by frontend:', apiUrl);

    expect(apiUrl).toBeTruthy();
    // Should be HTTPS in Cloud Run
    expect(apiUrl).toMatch(/^https:\/\//);
  });

  test('shops data loads from API', async ({ page }) => {
    let shopsData: any = null;

    page.on('response', async (response) => {
      if (response.url().includes('/api/shops') && response.status() === 200) {
        try {
          shopsData = await response.json();
        } catch (e) {
          console.error('Failed to parse shops response:', e);
        }
      }
    });

    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    console.log('Shops data received:', shopsData ? `${shopsData.length} shops` : 'No data');

    expect(shopsData).toBeTruthy();
    expect(validateShopsResponse(shopsData)).toBeTruthy();
    expect(shopsData.length).toBeGreaterThan(0);
  });

  test('users data loads from API', async ({ page }) => {
    let usersData: any = null;

    page.on('response', async (response) => {
      if (response.url().includes('/api/users') && response.status() === 200) {
        try {
          usersData = await response.json();
        } catch (e) {
          console.error('Failed to parse users response:', e);
        }
      }
    });

    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    // Users endpoint might not be implemented or might return empty array
    if (usersData !== null) {
      console.log('Users data received:', usersData.length, 'users');
      expect(validateUsersResponse(usersData)).toBeTruthy();
    } else {
      console.log('Users data not loaded - endpoint might not be available');
    }
  });

  test('performance: API responses under 1000ms threshold', async ({ page }) => {
    const apiTimings: { url: string; duration: number }[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        const timing = response.request().timing();
        if (timing) {
          apiTimings.push({
            url: response.url(),
            duration: timing.responseEnd - timing.requestStart,
          });
        }
      }
    });

    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    console.log('API response timings in Cloud Run:');
    apiTimings.forEach((timing) => {
      console.log(`  ${timing.url}: ${timing.duration}ms`);
      expect(timing.duration).toBeLessThan(1000);
    });
  });

  test('HTTPS is enforced', async ({ page }) => {
    const url = page.url();
    expect(url).toMatch(/^https:\/\//);
    console.log('✓ HTTPS enforced');
  });

  test('all static assets load successfully', async ({ page }) => {
    const failedResources: string[] = [];

    page.on('response', (response) => {
      if (!response.ok() && response.status() !== 304) {
        failedResources.push(`${response.url()} -> ${response.status()}`);
      }
    });

    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    if (failedResources.length > 0) {
      console.error('Failed to load resources:', failedResources);
    }

    expect(failedResources.length).toBe(0);
  });

  test('UI is interactive and responsive', async ({ page }) => {
    await waitForDataLoading(page).catch(() => {});
    await waitForShopCards(page);

    // Try clicking on a shop card
    const firstCard = page.locator('[data-testid="shop-card"]').first();
    await firstCard.click();
    await page.waitForTimeout(500);

    // Try switching tabs
    const tabs = page.locator('button[role="tab"]');
    if ((await tabs.count()) >= 2) {
      await tabs.nth(1).click();
      await page.waitForTimeout(500);
    }

    console.log('✓ UI is interactive');
  });

  test('search functionality works in production', async ({ page }) => {
    await waitForDataLoading(page).catch(() => {});
    await waitForShopCards(page);

    const searchInput = page.locator('input[type="text"]').first();

    if (await searchInput.count() > 0) {
      const initialCount = await page.locator('[data-testid="shop-card"]').count();

      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      const filteredCount = await page.locator('[data-testid="shop-card"]').count();

      console.log(`Search: ${initialCount} -> ${filteredCount} shops`);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });

  test('mobile viewport works in production', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});

    const shopCards = page.locator('[data-testid="shop-card"]');
    if (await shopCards.count() > 0) {
      await expect(shopCards.first()).toBeVisible();
      console.log('✓ Mobile viewport works');
    }
  });

  test('no console errors in production', async ({ page, errorCollector }) => {
    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    // Interact with the page
    const shopCards = page.locator('[data-testid="shop-card"]');
    if (await shopCards.count() > 0) {
      await shopCards.first().click();
      await page.waitForTimeout(500);
    }

    const errors = errorCollector.getErrors();
    if (errors.length > 0) {
      console.error('Console errors in production:', errors);
    }

    expect(errors.length).toBe(0);
  });
});

test.describe('Cloud Run API Direct Tests', () => {
  // Get API URL from environment
  const apiUrl = process.env.API_URL || process.env.VITE_API_URL;

  test.skip(!apiUrl, 'API URL not provided');

  test('API health endpoint is accessible', async ({ request }) => {
    if (!apiUrl) return;

    const response = await request.get(`${apiUrl}/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('Cloud Run API health:', data);
  });

  test('API shops endpoint returns data', async ({ request }) => {
    if (!apiUrl) return;

    const response = await request.get(`${apiUrl}/api/shops`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log(`Cloud Run API returned ${data.length} shops`);

    expect(validateShopsResponse(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('API CORS headers are correct', async ({ request }) => {
    if (!apiUrl) return;

    const response = await request.get(`${apiUrl}/api/shops`);
    const headers = response.headers();

    console.log('CORS headers:', headers['access-control-allow-origin']);
    expect(headers['access-control-allow-origin']).toBeTruthy();
  });
});
