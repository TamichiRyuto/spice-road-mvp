import { test as base } from '@playwright/test';
import { ConsoleErrorCollector } from './helpers';

/**
 * Extended test fixtures with custom setup
 */
export const test = base.extend<{
  errorCollector: ConsoleErrorCollector;
}>({
  errorCollector: async ({ page }, use) => {
    const collector = new ConsoleErrorCollector(page);
    await use(collector);
  },
});

export { expect } from '@playwright/test';

/**
 * Sample shop data for testing
 */
export const SAMPLE_SHOPS = [
  {
    id: '1',
    name: '菩薩咖喱',
    address: '奈良県奈良市薬師堂町21',
    latitude: 34.676154,
    longitude: 135.831229,
    spiceParameters: {
      spiciness: 60,
      stimulation: 45,
      aroma: 85,
    },
    rating: 4.6,
    description: '奈良市初のダルバート専門店',
  },
  {
    id: '2',
    name: 'ハチノス',
    address: '奈良県奈良市南市町8-1 古古古屋1階',
    latitude: 34.679894,
    longitude: 135.830062,
    spiceParameters: {
      spiciness: 70,
      stimulation: 75,
      aroma: 80,
    },
    rating: 4.4,
    description: 'ならまちの薬膳スパイススープカレーと蜂蜜の店',
  },
];

/**
 * Sample user data for testing
 */
export const SAMPLE_USERS = [
  {
    id: 'user-1',
    displayName: 'Test User 1',
    bio: 'Spice enthusiast',
    preferences: {
      spiceLevel: 'high',
    },
    createdAt: new Date().toISOString(),
  },
];
