/**
 * Diagnostic script for Cloud Run deployment issue
 * Simulates frontend behavior to identify why "nothing displays"
 */

const https = require('https');

const FRONTEND_URL = 'https://spice-road-mvp-frontend-dev-gpxy5envpq-dt.a.run.app';
const API_URL = 'https://spice-road-mvp-cpp-api-dev-gpxy5envpq-dt.a.run.app';

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

async function diagnose() {
  console.log('🔍 Diagnosing Cloud Run deployment issue...\n');

  // Test 1: Frontend HTML
  console.log('Test 1: Frontend HTML accessibility');
  try {
    const frontendResponse = await fetchText(FRONTEND_URL);
    console.log(`✅ Status: ${frontendResponse.statusCode}`);
    console.log(`✅ Content-Type: ${frontendResponse.headers['content-type']}`);
    console.log(`✅ HTML length: ${frontendResponse.body.length} chars`);

    // Check if JavaScript bundle is referenced
    const jsMatch = frontendResponse.body.match(/src="(\/assets\/[^"]+\.js)"/);
    if (jsMatch) {
      console.log(`✅ JS bundle found: ${jsMatch[1]}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }

  console.log('\n---\n');

  // Test 2: API Health
  console.log('Test 2: API Health endpoint');
  try {
    const healthResponse = await fetchJSON(`${API_URL}/health`);
    console.log(`✅ Status: ${healthResponse.statusCode}`);
    console.log(`✅ Response:`, healthResponse.body);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }

  console.log('\n---\n');

  // Test 3: API Shops endpoint
  console.log('Test 3: API /api/shops endpoint');
  try {
    const shopsResponse = await fetchJSON(`${API_URL}/api/shops`);
    console.log(`✅ Status: ${shopsResponse.statusCode}`);
    console.log(`✅ CORS header: ${shopsResponse.headers['access-control-allow-origin']}`);

    if (Array.isArray(shopsResponse.body)) {
      console.log(`✅ Shops count: ${shopsResponse.body.length}`);
      if (shopsResponse.body.length > 0) {
        const firstShop = shopsResponse.body[0];
        console.log(`✅ First shop: ${firstShop.name}`);
        console.log(`✅ Shop has required fields:`, {
          id: !!firstShop.id,
          name: !!firstShop.name,
          latitude: !!firstShop.latitude,
          longitude: !!firstShop.longitude,
          spiceParameters: !!firstShop.spiceParameters
        });
      } else {
        console.warn('⚠️  API returned empty array');
      }
    } else {
      console.error('❌ API response is not an array:', typeof shopsResponse.body);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }

  console.log('\n---\n');

  // Test 4: Check for API URL in frontend bundle
  console.log('Test 4: Check API URL configuration in frontend');
  try {
    const frontendHtml = await fetchText(FRONTEND_URL);
    const jsMatch = frontendHtml.body.match(/src="(\/assets\/[^"]+\.js)"/);

    if (jsMatch) {
      const jsUrl = `${FRONTEND_URL}${jsMatch[1]}`;
      const jsResponse = await fetchText(jsUrl);

      console.log(`✅ JavaScript bundle size: ${jsResponse.body.length} chars`);

      // Check for API URL in bundle
      if (jsResponse.body.includes(API_URL)) {
        console.log(`✅ Correct API URL found in bundle: ${API_URL}`);
      } else {
        console.error(`❌ API URL NOT found in bundle`);

        // Check for other run.app URLs
        const runAppUrls = jsResponse.body.match(/https:\/\/[^"]+\.run\.app[^"']*/g);
        if (runAppUrls) {
          console.log(`⚠️  Found these Cloud Run URLs:`, [...new Set(runAppUrls)]);
        }
      }

      // Check for common issues
      if (jsResponse.body.includes('VITE_API_URL')) {
        console.warn('⚠️  VITE_API_URL variable name found - might not be replaced');
      }
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }

  console.log('\n---\n');

  // Summary
  console.log('📊 Diagnosis Summary:');
  console.log('1. Check if API URL is correctly embedded in frontend bundle');
  console.log('2. Verify that API returns data (50 shops expected)');
  console.log('3. Confirm CORS headers are present');
  console.log('4. Test frontend in browser developer tools to see network requests');
  console.log('\n💡 Next steps:');
  console.log('- If API URL is missing/wrong in bundle, rebuild frontend with correct VITE_API_URL');
  console.log('- If data returns but UI shows nothing, check React component rendering logic');
  console.log('- Use browser dev tools to check for JavaScript errors');
}

diagnose().catch(console.error);
