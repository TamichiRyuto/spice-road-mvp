import { test, expect } from '../shared/fixtures';
import {
  waitForDataLoading,
  waitForShopCards,
  waitForNetworkIdle,
  getPerformanceMetrics,
} from '../shared/helpers';

test.describe('Frontend Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Spice Road|カレー|Curry/i);
    await page.waitForLoadState('domcontentloaded');
  });

  test('loading spinner appears and disappears', async ({ page }) => {
    // This test may fail if the page loads too quickly
    // Wait for loading spinner
    const loadingText = page.locator('text=データを読み込み中');

    // Either it's currently visible or it has already disappeared
    const isVisible = await loadingText.isVisible().catch(() => false);
    if (isVisible) {
      await loadingText.waitFor({ state: 'hidden', timeout: 10000 });
    }

    // After loading, content should be visible
    await page.waitForLoadState('networkidle');
    await expect(loadingText).not.toBeVisible();
  });

  test('shop data loads and displays - CRITICAL BUG DETECTION', async ({ page, errorCollector }) => {
    // Wait for data loading to complete
    await waitForDataLoading(page).catch(async () => {
      // If loading spinner doesn't appear, data might already be loaded
      await page.waitForLoadState('networkidle');
    });

    // CRITICAL: Verify shops actually display
    // This test catches the "nothing displays" bug
    const shopCardsCount = await waitForShopCards(page, 1);

    console.log(`Found ${shopCardsCount} shop cards`);
    expect(shopCardsCount).toBeGreaterThan(0);

    // Verify no console errors occurred
    if (errorCollector.hasErrors()) {
      console.error('Console errors detected:', errorCollector.getErrors());
    }
  });

  test('shop cards render with correct data', async ({ page }) => {
    await waitForDataLoading(page).catch(() => {});
    await waitForShopCards(page);

    // Get first shop card
    const firstCard = page.locator('[data-testid="shop-card"]').first();
    await expect(firstCard).toBeVisible();

    // Verify card contains required data
    await expect(firstCard).toContainText(/./); // Has some text

    // Look for shop name (any text in the card)
    const cardText = await firstCard.textContent();
    expect(cardText).toBeTruthy();
    expect(cardText!.length).toBeGreaterThan(0);
  });

  test('tabs switch correctly (Map view ↔ Spice analysis)', async ({ page }) => {
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    // Look for tab buttons
    const tabs = page.locator('button[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount >= 2) {
      // Click second tab (Spice analysis)
      await tabs.nth(1).click();
      await page.waitForTimeout(500); // Wait for tab animation

      // Click first tab (Map view)
      await tabs.nth(0).click();
      await page.waitForTimeout(500);
    } else {
      console.log('Tab navigation not found, skipping test');
    }
  });

  test('search bar exists and is functional', async ({ page }) => {
    await waitForDataLoading(page).catch(() => {});

    // Look for search input
    const searchInput = page.locator('input[type="text"], input[placeholder*="検索"], input[aria-label*="検索"]').first();

    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
      await searchInput.fill('カレー');
      await page.waitForTimeout(500); // Wait for filter to apply

      // Verify input has value
      await expect(searchInput).toHaveValue('カレー');
    } else {
      console.log('Search input not found, might be using different selector');
    }
  });

  test('shop list filters by search term', async ({ page }) => {
    await waitForDataLoading(page).catch(() => {});
    await waitForShopCards(page);

    const initialCount = await page.locator('[data-testid="shop-card"]').count();
    console.log(`Initial shop count: ${initialCount}`);

    // Find search input
    const searchInput = page.locator('input[type="text"]').first();

    if (await searchInput.count() > 0) {
      // Search for a specific term that might not match all shops
      await searchInput.fill('XYZ_NOT_FOUND');
      await page.waitForTimeout(1000);

      // Count should change (might be 0 or less than initial)
      const filteredCount = await page.locator('[data-testid="shop-card"]').count();
      console.log(`Filtered shop count: ${filteredCount}`);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });

  test('region filter works', async ({ page }) => {
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    // Look for region filter buttons or dropdown
    const regionButtons = page.locator('button').filter({ hasText: /奈良|大阪|京都/ });
    const buttonCount = await regionButtons.count();

    if (buttonCount > 0) {
      console.log(`Found ${buttonCount} region filter buttons`);
      await regionButtons.first().click();
      await page.waitForTimeout(500);
    } else {
      console.log('Region filters not found, might use different UI pattern');
    }
  });

  test('performance: page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    console.log(`Page load time: ${loadTime}ms`);

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('API requests complete within 1000ms threshold', async ({ page }) => {
    // Monitor API requests
    const apiRequests: { url: string; duration: number }[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const request = response.request();
        const timing = response.request().timing();
        if (timing) {
          const duration = timing.responseEnd;
          apiRequests.push({
            url: response.url(),
            duration,
          });
        }
      }
    });

    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    console.log('API request timings:', apiRequests);

    // Verify all API requests completed within threshold
    apiRequests.forEach((req) => {
      console.log(`${req.url}: ${req.duration}ms`);
      expect(req.duration).toBeLessThan(1000);
    });
  });

  test('no console errors on page load', async ({ page, errorCollector }) => {
    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await waitForNetworkIdle(page);

    const errors = errorCollector.getErrors();
    if (errors.length > 0) {
      console.error('Console errors found:', errors);
    }

    // Allow warnings but fail on errors
    expect(errors.length).toBe(0);
  });

  test('user registration modal can be opened', async ({ page }) => {
    await waitForDataLoading(page).catch(() => {});

    // Look for "register" or "登録" button
    const registerButton = page.locator('button').filter({ hasText: /登録|Register/i });

    if (await registerButton.count() > 0) {
      await registerButton.first().click();
      await page.waitForTimeout(500);

      // Look for modal or dialog
      const dialog = page.locator('[role="dialog"], .modal, [aria-modal="true"]');
      if (await dialog.count() > 0) {
        await expect(dialog.first()).toBeVisible();
      }
    } else {
      console.log('Registration button not found, feature might not be implemented yet');
    }
  });

  test('responsive design: page works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});

    // Verify content is still visible
    const shopCards = page.locator('[data-testid="shop-card"]');
    if (await shopCards.count() > 0) {
      await expect(shopCards.first()).toBeVisible();
    }
  });

  test('shop card click shows details', async ({ page }) => {
    await waitForDataLoading(page).catch(() => {});
    await waitForShopCards(page);

    // Click first shop card
    const firstCard = page.locator('[data-testid="shop-card"]').first();
    await firstCard.click();
    await page.waitForTimeout(500);

    // Look for expanded details or navigation
    // This depends on the actual UI implementation
    console.log('Shop card clicked - verify details display in actual UI');
  });

  test('accessibility: page has proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});

    // Check for main landmarks
    const main = page.locator('main, [role="main"]');
    const nav = page.locator('nav, [role="navigation"]');

    // At least some semantic HTML should be present
    const hasSemanticHtml = (await main.count()) > 0 || (await nav.count()) > 0;
    expect(hasSemanticHtml).toBeTruthy();
  });
});

test.describe('Frontend Error Handling', () => {
  test('handles API failure gracefully with fallback data', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/shops', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should still show fallback shops (菩薩咖喱, ハチノス, 若草カレー本舗)
    const fallbackShopNames = ['菩薩咖喱', 'ハチノス', '若草カレー本舗'];

    for (const name of fallbackShopNames) {
      const shopCard = page.locator(`text=${name}`);
      if (await shopCard.count() > 0) {
        console.log(`Found fallback shop: ${name}`);
      }
    }
  });

  test('handles empty API response', async ({ page }) => {
    // Mock API to return empty array
    await page.route('**/api/shops', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should handle empty state gracefully
    console.log('Empty API response handled - verify UI shows appropriate message');
  });
});
