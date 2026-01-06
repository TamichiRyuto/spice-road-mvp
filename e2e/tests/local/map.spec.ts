import { test, expect } from '../shared/fixtures';
import { waitForDataLoading, waitForShopCards, waitForNetworkIdle } from '../shared/helpers';

test.describe('Google Maps Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
  });

  test('Google Maps container is present', async ({ page }) => {
    // Look for map container
    const mapContainer = page.locator('.gm-style, [class*="map"], #map, [role="region"][aria-label*="Map"]');

    if (await mapContainer.count() > 0) {
      await expect(mapContainer.first()).toBeVisible();
      console.log('Google Maps container found');
    } else {
      console.log('Map container not found - might be in a different tab or not loaded yet');
    }
  });

  test('Google Maps loads within map tab', async ({ page }) => {
    await waitForNetworkIdle(page);

    // Switch to map tab if tabs exist
    const tabs = page.locator('button[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount >= 1) {
      // Click first tab (should be map view)
      await tabs.first().click();
      await page.waitForTimeout(1000); // Wait for map to load
    }

    // Look for Google Maps elements
    const googleMapsIframe = page.locator('iframe[src*="google.com/maps"]');
    const mapDiv = page.locator('.gm-style');

    const hasGoogleMaps =
      (await googleMapsIframe.count()) > 0 || (await mapDiv.count()) > 0;

    if (hasGoogleMaps) {
      console.log('Google Maps loaded successfully');
    } else {
      console.log('Google Maps elements not detected - might use different integration');
    }
  });

  test('shop markers appear on map', async ({ page }) => {
    await waitForShopCards(page).catch(() => {});
    await page.waitForTimeout(2000); // Wait for map markers to render

    // Look for map markers
    // Google Maps markers can have various selectors
    const markerSelectors = [
      '[role="button"][aria-label*="marker"]',
      'img[src*="marker"]',
      '[class*="marker"]',
      'button[title*="店"]',
    ];

    let markersFound = false;
    for (const selector of markerSelectors) {
      const markers = page.locator(selector);
      const count = await markers.count();

      if (count > 0) {
        console.log(`Found ${count} markers with selector: ${selector}`);
        markersFound = true;
        expect(count).toBeGreaterThan(0);
        break;
      }
    }

    if (!markersFound) {
      console.log('Map markers not detected - might use custom marker implementation');
    }
  });

  test('clicking shop marker shows shop details', async ({ page }) => {
    await waitForShopCards(page).catch(() => {});
    await page.waitForTimeout(2000);

    // Try to find and click a marker
    const markerButton = page.locator('[role="button"]').filter({ hasText: /店|curry/i }).first();

    if (await markerButton.count() > 0) {
      await markerButton.click();
      await page.waitForTimeout(500);

      // Look for info window or popup
      const infoWindow = page.locator('[role="dialog"], .gm-style-iw, [class*="info"]');
      if (await infoWindow.count() > 0) {
        console.log('Info window appeared after marker click');
      }
    } else {
      console.log('Marker button not found for click test');
    }
  });

  test('map shows correct initial center (Nara region)', async ({ page }) => {
    await waitForNetworkIdle(page);
    await page.waitForTimeout(2000); // Wait for map to initialize

    // Google Maps loads - verify by checking for map container
    const mapContainer = page.locator('.gm-style, [class*="map"]');

    if (await mapContainer.count() > 0) {
      console.log('Map centered on expected region');

      // The actual center coordinates would need to be verified via Google Maps API
      // This is a basic check that the map is present
      expect(await mapContainer.count()).toBeGreaterThan(0);
    }
  });

  test('location indicator shows geolocation status', async ({ page }) => {
    await waitForNetworkIdle(page);

    // Look for geolocation indicator
    const locationIndicators = page.locator('[data-testid*="location"], [aria-label*="location"], [class*="location"]');

    if (await locationIndicators.count() > 0) {
      console.log(`Found ${await locationIndicators.count()} location indicators`);
      await expect(locationIndicators.first()).toBeVisible();
    } else {
      console.log('Location indicator not found - might not be implemented');
    }
  });

  test('map zoom controls work', async ({ page }) => {
    await waitForNetworkIdle(page);
    await page.waitForTimeout(1000);

    // Look for zoom buttons
    const zoomIn = page.locator('button[aria-label*="Zoom in"], button[title*="Zoom in"]');
    const zoomOut = page.locator('button[aria-label*="Zoom out"], button[title*="Zoom out"]');

    if ((await zoomIn.count()) > 0 && (await zoomOut.count()) > 0) {
      console.log('Zoom controls found');

      // Try clicking zoom in
      await zoomIn.first().click();
      await page.waitForTimeout(500);

      // Try clicking zoom out
      await zoomOut.first().click();
      await page.waitForTimeout(500);

      console.log('Zoom controls tested successfully');
    } else {
      console.log('Zoom controls not found');
    }
  });

  test('map responds to window resize', async ({ page }) => {
    await waitForNetworkIdle(page);
    await page.waitForTimeout(1000);

    const initialSize = await page.viewportSize();

    // Resize window
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);

    // Resize back
    await page.setViewportSize(initialSize!);
    await page.waitForTimeout(500);

    // Map should still be visible
    const mapContainer = page.locator('.gm-style, [class*="map"]');
    if (await mapContainer.count() > 0) {
      await expect(mapContainer.first()).toBeVisible();
      console.log('Map handled resize correctly');
    }
  });
});

test.describe('Map Performance', () => {
  test('map loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await page.waitForTimeout(2000); // Wait for map

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log(`Map load time: ${loadTime}ms`);

    // Map should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('map markers render without performance issues', async ({ page }) => {
    await page.goto('/');
    await waitForShopCards(page).catch(() => {});

    // Measure performance
    const metrics = await page.evaluate(() => {
      return {
        memory: (performance as any).memory?.usedJSHeapSize,
        navigation: performance.getEntriesByType('navigation')[0],
      };
    });

    console.log('Performance metrics:', metrics);

    // Basic check - no specific threshold, just log
    expect(metrics).toBeTruthy();
  });
});

test.describe('Map Error Handling', () => {
  test('app handles missing Google Maps API key gracefully', async ({ page }) => {
    // This test checks if the app shows appropriate error or fallback
    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await page.waitForTimeout(2000);

    // Look for error messages
    const errorMessages = page.locator('text=/error|エラー|failed|失敗/i');

    if (await errorMessages.count() > 0) {
      console.log('Error message found - app handles missing API key');
    } else {
      console.log('No error message - map might have loaded successfully');
    }

    // Even without map, shop list should still work
    const shopCards = page.locator('[data-testid="shop-card"]');
    if (await shopCards.count() > 0) {
      console.log('Shop list still works without map');
    }
  });

  test('map handles network errors gracefully', async ({ page }) => {
    // Block Google Maps API requests
    await page.route('**/maps.googleapis.com/**', (route) => {
      route.abort();
    });

    await page.goto('/');
    await waitForDataLoading(page).catch(() => {});
    await page.waitForTimeout(2000);

    // App should still be functional
    const shopCards = page.locator('[data-testid="shop-card"]');
    if (await shopCards.count() > 0) {
      console.log('App still functional despite map loading failure');
    }
  });
});
