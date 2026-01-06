import { test, expect } from '../shared/fixtures';

/**
 * Smoke Tests for Cloud Run Deployment
 *
 * Quick, essential tests to verify basic functionality.
 * These should run fast (< 30 seconds total) and catch critical issues.
 */

test.describe('Cloud Run Smoke Tests', () => {
  test('frontend URL is accessible', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
    console.log('✓ Frontend accessible');
  });

  test('page has title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    console.log('Page title:', title);
  });

  test('page loads main content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(50);
    console.log('✓ Main content loaded');
  });

  test('no 404 or 500 errors on page load', async ({ page }) => {
    let hasError = false;

    page.on('response', (response) => {
      if (response.status() >= 400) {
        console.error(`Error response: ${response.url()} -> ${response.status()}`);
        hasError = true;
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(hasError).toBe(false);
  });

  test('at least one API call succeeds', async ({ page }) => {
    const apiCalls: { url: string; status: number }[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    console.log('API calls made:', apiCalls);

    expect(apiCalls.length).toBeGreaterThan(0);

    const successfulCalls = apiCalls.filter((call) => call.status === 200);
    expect(successfulCalls.length).toBeGreaterThan(0);
  });
});

test.describe('Cloud Run API Smoke Tests', () => {
  const apiUrl = process.env.API_URL || process.env.VITE_API_URL;

  test.skip(!apiUrl, 'API URL not provided');

  test('API health endpoint responds', async ({ request }) => {
    if (!apiUrl) return;

    const response = await request.get(`${apiUrl}/health`, {
      timeout: 5000,
    });

    console.log('API health status:', response.status());
    expect(response.status()).toBeLessThan(500);
  });

  test('API shops endpoint responds', async ({ request }) => {
    if (!apiUrl) return;

    const response = await request.get(`${apiUrl}/api/shops`, {
      timeout: 5000,
    });

    console.log('API shops status:', response.status());
    expect(response.ok()).toBeTruthy();
  });

  test('API returns JSON', async ({ request }) => {
    if (!apiUrl) return;

    const response = await request.get(`${apiUrl}/api/shops`);
    const contentType = response.headers()['content-type'];

    expect(contentType).toContain('application/json');
  });
});
