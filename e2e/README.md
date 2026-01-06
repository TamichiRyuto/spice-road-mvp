# E2E Tests for Spice Road MVP

This directory contains end-to-end tests for the Spice Road MVP application using Playwright.

## Overview

The E2E test suite validates both local (docker-compose) and production (Cloud Run) environments to ensure the application works correctly before and after deployment.

## Test Structure

```
e2e/
├── playwright.config.ts          # Playwright configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tests/
│   ├── local/                    # Tests for docker-compose environment
│   │   ├── frontend.spec.ts      # Core UI tests (15+ test cases)
│   │   ├── api.spec.ts           # API integration tests (14 test cases)
│   │   └── map.spec.ts           # Google Maps tests (12 test cases)
│   ├── cloud-run/                # Tests for Cloud Run environment
│   │   ├── deployment.spec.ts    # Production validation (15+ test cases)
│   │   └── smoke.spec.ts         # Quick health checks (8 test cases)
│   └── shared/                   # Shared utilities
│       ├── helpers.ts            # Test helper functions
│       └── fixtures.ts           # Custom Playwright fixtures
└── .env.example                  # Environment variables template
```

## Setup

### Install Dependencies

```bash
cd e2e
npm install
npx playwright install --with-deps chromium
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

For local testing:
```env
BASE_URL=http://localhost:10080
API_URL=http://localhost:8080
```

For Cloud Run testing:
```env
BASE_URL=https://your-frontend-url.run.app
API_URL=https://your-api-url.run.app
```

## Running Tests

### Local Tests (docker-compose)

First, start the services:

```bash
# From project root
docker-compose up -d
```

Wait for services to be healthy, then run tests:

```bash
cd e2e
npm run test:local
```

### Cloud Run Tests

Set the environment variables for Cloud Run URLs:

```bash
export BASE_URL=https://your-frontend-url.run.app
export API_URL=https://your-api-url.run.app

cd e2e
npm run test:cloud-run
```

### All Tests

Run all tests (both local and cloud-run):

```bash
cd e2e
npm test
```

### Debug Mode

Run tests with Playwright Inspector:

```bash
cd e2e
npm run test:debug
```

### UI Mode

Run tests with Playwright UI:

```bash
cd e2e
npm run test:ui
```

### Headed Mode

Run tests with visible browser:

```bash
cd e2e
npm run test:headed
```

## Test Categories

### Frontend Tests (`tests/local/frontend.spec.ts`)

- Page loads successfully
- Loading spinner behavior
- **CRITICAL: Data displays after loading** (catches "nothing displays" bug)
- Shop cards render with correct data
- Tab switching (Map ↔ Spice analysis)
- Search functionality
- Region filters
- User registration modal
- Performance benchmarks
- Mobile responsiveness
- Accessibility checks
- Error handling (API failures, empty responses)

### API Tests (`tests/local/api.spec.ts`)

- Health endpoint
- GET /api/shops (validation, required fields)
- GET /api/shops/:id (single shop, 404 handling)
- GET /api/users
- CORS headers
- Metrics endpoint
- Response time (< 1000ms threshold)
- JSON content type
- Error handling (malformed requests, large parameters)

### Map Tests (`tests/local/map.spec.ts`)

- Google Maps container presence
- Map loads within tab
- Shop markers appear
- Marker click shows details
- Map center (Nara region)
- Location indicator
- Zoom controls
- Window resize handling
- Performance benchmarks
- Error handling (missing API key, network errors)

### Cloud Run Deployment Tests (`tests/cloud-run/deployment.spec.ts`)

- Frontend accessibility at Cloud Run URL
- Page loads without errors
- **CRITICAL: Data displays in production** (catches deployment bugs)
- API connectivity from frontend
- Correct API URL usage
- Shops and users data loading
- Performance (API < 1000ms, page < 5s)
- HTTPS enforcement
- Static assets load successfully
- UI interactivity
- Search functionality
- Mobile viewport
- No console errors
- Direct API tests (health, shops, CORS)

### Smoke Tests (`tests/cloud-run/smoke.spec.ts`)

- Frontend URL accessible
- Page has title
- Main content loads
- No 404/500 errors
- At least one API call succeeds
- API health responds
- API shops responds
- API returns JSON

## GitHub Actions Integration

The E2E tests run automatically in CI/CD via `.github/workflows/e2e-tests.yml`:

### Workflow Stages

1. **Local E2E Tests**: Run tests against docker-compose environment
2. **Deploy**: Deploy to Cloud Run using Terraform
3. **Cloud Run E2E Tests**: Run tests against deployed environment
4. **Summary**: Generate test summary

### Workflow Triggers

- Push to `main` branch
- Pull requests to `main` branch
- Manual trigger via `workflow_dispatch`

### Test Artifacts

Test results, screenshots, and videos are uploaded as artifacts:
- `playwright-results-local`: Local test results (7 days retention)
- `playwright-results-cloud-run`: Cloud Run test results (30 days retention)

### Viewing Test Results

1. Go to GitHub Actions tab
2. Click on the workflow run
3. Check the "Summary" for test status
4. Download artifacts for detailed reports

## Test Reports

After running tests, view the HTML report:

```bash
cd e2e
npm run report
```

This opens an interactive HTML report with:
- Test results by file
- Screenshots of failures
- Video recordings
- Trace viewer for debugging

## Debugging Failed Tests

### View Screenshots

Screenshots are automatically captured on test failures:

```bash
ls -l test-results/
```

### View Videos

Videos are recorded for failed tests:

```bash
ls -l test-results/**/*.webm
```

### Use Trace Viewer

Traces are captured on first retry:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## Writing New Tests

### Example Test

```typescript
import { test, expect } from '../shared/fixtures';
import { waitForDataLoading } from '../shared/helpers';

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/');
    await waitForDataLoading(page);

    // Your test logic here
    const element = page.locator('[data-testid="my-element"]');
    await expect(element).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for data loading** before assertions
3. **Use shared helpers** for common operations
4. **Collect console errors** using `errorCollector` fixture
5. **Add descriptive test names** that explain what is being tested
6. **Test both success and error cases**
7. **Use timeouts appropriately** (default: 30s)

## Troubleshooting

### Tests Failing Locally

1. Ensure docker-compose services are running:
   ```bash
   docker-compose ps
   ```

2. Check service logs:
   ```bash
   docker-compose logs cpp-api
   docker-compose logs frontend
   ```

3. Verify services are healthy:
   ```bash
   curl http://localhost:8080/health
   curl http://localhost:10080
   ```

### Tests Failing in Cloud Run

1. Check deployment URLs are correct:
   ```bash
   echo $BASE_URL
   echo $API_URL
   ```

2. Verify services are accessible:
   ```bash
   curl $API_URL/health
   curl $FRONTEND_URL
   ```

3. Check Cloud Run logs in GCP Console

### "Nothing Displays" Bug

This bug is specifically tested in:
- `tests/local/frontend.spec.ts`: "shop data loads and displays - CRITICAL BUG DETECTION"
- `tests/cloud-run/deployment.spec.ts`: "CRITICAL: data displays after loading"

These tests verify that:
1. Loading spinner disappears
2. Shop cards are actually rendered
3. Shop cards have content

If these tests fail, check:
- API is returning valid data
- Frontend environment variables (VITE_API_URL)
- CORS configuration
- Console errors

## Performance Benchmarks

Tests include performance checks:
- Page load time: < 5 seconds
- API response time: < 1000ms
- Map load time: < 5 seconds

## CI/CD Integration

### Skip E2E Tests

Add `[skip e2e]` to commit message:

```bash
git commit -m "Update docs [skip e2e]"
```

### Manual Deployment

Run deployment without E2E tests using workflow_dispatch in GitHub Actions.

## Support

For issues or questions:
- Check GitHub Actions workflow logs
- Review test artifacts (screenshots, videos)
- Consult Playwright documentation: https://playwright.dev

## License

Same as parent project.
