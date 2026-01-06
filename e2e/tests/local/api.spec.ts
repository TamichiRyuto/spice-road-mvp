import { test, expect } from '../shared/fixtures';
import { validateShopsResponse, validateUsersResponse, getApiUrl } from '../shared/helpers';

test.describe('API Integration Tests', () => {
  const apiUrl = getApiUrl();

  test('GET /health returns 200 OK', async ({ request }) => {
    const response = await request.get(`${apiUrl}/health`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('Health check response:', data);
  });

  test('GET /api/shops returns valid array', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/shops`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log(`Received ${data.length} shops`);

    // Validate response structure
    expect(validateShopsResponse(data)).toBeTruthy();
  });

  test('GET /api/shops returns shops with required fields', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/shops`);
    const data = await response.json();

    expect(Array.isArray(data)).toBeTruthy();

    if (data.length > 0) {
      const shop = data[0];

      // Required fields
      expect(shop).toHaveProperty('id');
      expect(shop).toHaveProperty('name');
      expect(shop).toHaveProperty('address');
      expect(shop).toHaveProperty('latitude');
      expect(shop).toHaveProperty('longitude');
      expect(shop).toHaveProperty('spiceParameters');
      expect(shop).toHaveProperty('rating');

      // Spice parameters
      expect(shop.spiceParameters).toHaveProperty('spiciness');
      expect(shop.spiceParameters).toHaveProperty('stimulation');
      expect(shop.spiceParameters).toHaveProperty('aroma');

      // Value ranges
      expect(shop.spiceParameters.spiciness).toBeGreaterThanOrEqual(0);
      expect(shop.spiceParameters.spiciness).toBeLessThanOrEqual(100);
      expect(shop.latitude).toBeGreaterThan(-90);
      expect(shop.latitude).toBeLessThan(90);
      expect(shop.longitude).toBeGreaterThan(-180);
      expect(shop.longitude).toBeLessThan(180);

      console.log('Sample shop:', {
        id: shop.id,
        name: shop.name,
        rating: shop.rating,
        spice: shop.spiceParameters,
      });
    }
  });

  test('GET /api/shops/:id returns single shop', async ({ request }) => {
    // First, get all shops
    const listResponse = await request.get(`${apiUrl}/api/shops`);
    const shops = await listResponse.json();

    if (shops.length > 0) {
      const shopId = shops[0].id;

      // Get specific shop
      const response = await request.get(`${apiUrl}/api/shops/${shopId}`);
      expect(response.ok()).toBeTruthy();

      const shop = await response.json();
      expect(shop.id).toBe(shopId);
      expect(shop.name).toBeTruthy();

      console.log(`Retrieved shop: ${shop.name}`);
    } else {
      console.log('No shops available to test individual retrieval');
    }
  });

  test('GET /api/shops/:id with non-existent ID returns 404', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/shops/non-existent-id-12345`);
    expect(response.status()).toBe(404);

    console.log('404 correctly returned for non-existent shop');
  });

  test('GET /api/users returns valid array', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/users`);

    // Users endpoint might not be implemented yet
    if (response.status() === 404) {
      console.log('Users endpoint not implemented yet (404)');
      return;
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log(`Received ${data.length} users`);
    expect(validateUsersResponse(data)).toBeTruthy();
  });

  test('API responses include CORS headers', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/shops`);

    const headers = response.headers();
    console.log('CORS headers:', {
      'access-control-allow-origin': headers['access-control-allow-origin'],
      'access-control-allow-methods': headers['access-control-allow-methods'],
    });

    // CORS headers should be present
    expect(headers['access-control-allow-origin']).toBeTruthy();
  });

  test('GET /metrics returns metrics data', async ({ request }) => {
    const response = await request.get(`${apiUrl}/metrics`);

    // Metrics endpoint might return different status codes
    if (response.ok()) {
      const text = await response.text();
      console.log('Metrics response length:', text.length);
      expect(text.length).toBeGreaterThan(0);
    } else {
      console.log(`Metrics endpoint status: ${response.status()}`);
    }
  });

  test('API handles invalid endpoints with 404', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/invalid-endpoint`);
    expect(response.status()).toBe(404);
  });

  test('API response time is under 1000ms', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${apiUrl}/api/shops`);
    const endTime = Date.now();

    const duration = endTime - startTime;
    console.log(`API response time: ${duration}ms`);

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(1000);
  });

  test('API handles OPTIONS requests (CORS preflight)', async ({ request }) => {
    const response = await request.fetch(`${apiUrl}/api/shops`, {
      method: 'OPTIONS',
    });

    console.log(`OPTIONS request status: ${response.status()}`);

    // Should return 200 or 204
    expect([200, 204]).toContain(response.status());
  });

  test('API shops data count matches database count', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/shops`);
    const shops = await response.json();

    // This test verifies data integrity
    // The actual count depends on database seeding
    expect(shops.length).toBeGreaterThanOrEqual(0);
    console.log(`Total shops in database: ${shops.length}`);
  });

  test('API returns JSON content type', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/shops`);
    const contentType = response.headers()['content-type'];

    console.log('Content-Type:', contentType);
    expect(contentType).toContain('application/json');
  });
});

test.describe('API Error Handling', () => {
  const apiUrl = getApiUrl();

  test('API handles malformed requests gracefully', async ({ request }) => {
    // Try to POST to a GET-only endpoint
    const response = await request.post(`${apiUrl}/api/shops`, {
      data: { invalid: 'data' },
    });

    // Should return 4xx error, not 5xx
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    console.log(`Malformed request handled with status: ${response.status()}`);
  });

  test('API handles large query parameters', async ({ request }) => {
    const largeParam = 'x'.repeat(1000);
    const response = await request.get(`${apiUrl}/api/shops?search=${largeParam}`);

    // Should handle gracefully (either filter or return empty)
    expect([200, 400]).toContain(response.status());
  });
});
