import { Page, expect } from '@playwright/test';

/**
 * Shop data structure based on frontend types
 */
export interface Shop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  spiceParameters: {
    spiciness: number;
    stimulation: number;
    aroma: number;
  };
  rating: number;
  description?: string;
  region?: string;
}

/**
 * User data structure
 */
export interface User {
  id: string;
  displayName: string;
  bio?: string;
  preferences?: any;
  createdAt: string;
}

/**
 * Wait for the loading spinner to appear and disappear
 */
export async function waitForDataLoading(page: Page, timeout: number = 10000) {
  // Wait for loading spinner to appear
  await page.waitForSelector('text=データを読み込み中', {
    state: 'visible',
    timeout: 5000,
  });

  // Wait for loading spinner to disappear
  await page.waitForSelector('text=データを読み込み中', {
    state: 'hidden',
    timeout,
  });
}

/**
 * Validate API response for shops endpoint
 */
export function validateShopsResponse(data: any): data is Shop[] {
  if (!Array.isArray(data)) {
    return false;
  }

  if (data.length === 0) {
    return true; // Empty array is valid
  }

  // Validate first shop structure
  const shop = data[0];
  return (
    typeof shop.id === 'string' &&
    typeof shop.name === 'string' &&
    typeof shop.address === 'string' &&
    typeof shop.latitude === 'number' &&
    typeof shop.longitude === 'number' &&
    typeof shop.spiceParameters === 'object' &&
    typeof shop.spiceParameters.spiciness === 'number' &&
    typeof shop.spiceParameters.stimulation === 'number' &&
    typeof shop.spiceParameters.aroma === 'number' &&
    typeof shop.rating === 'number'
  );
}

/**
 * Validate API response for users endpoint
 */
export function validateUsersResponse(data: any): data is User[] {
  if (!Array.isArray(data)) {
    return false;
  }

  if (data.length === 0) {
    return true;
  }

  const user = data[0];
  return (
    typeof user.id === 'string' &&
    typeof user.displayName === 'string' &&
    typeof user.createdAt === 'string'
  );
}

/**
 * Get API URL from environment or default
 */
export function getApiUrl(): string {
  return process.env.API_URL || 'http://localhost:8080';
}

/**
 * Wait for network idle (no requests for a period)
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 2000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Collect console errors during test execution
 */
export class ConsoleErrorCollector {
  private errors: string[] = [];

  constructor(page: Page) {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      this.errors.push(error.message);
    });
  }

  getErrors(): string[] {
    return this.errors;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  clear() {
    this.errors = [];
  }
}

/**
 * Wait for shop cards to be visible
 */
export async function waitForShopCards(page: Page, minCount: number = 1) {
  // Wait for at least one shop card to be visible
  await page.waitForSelector('[data-testid="shop-card"]', {
    state: 'visible',
    timeout: 10000,
  });

  // Verify minimum count
  const count = await page.locator('[data-testid="shop-card"]').count();
  expect(count).toBeGreaterThanOrEqual(minCount);

  return count;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(page: Page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart,
    };
  });
}

/**
 * Mock API response
 */
export async function mockApiResponse(page: Page, url: string, data: any) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}
