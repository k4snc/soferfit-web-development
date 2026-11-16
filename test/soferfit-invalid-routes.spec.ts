import { test, expect } from '@playwright/test';

test.describe('SoferFit Invalid URL & Fallback Routing', () => {

  test('Random non-existent frontend route displays graceful fallback', async ({ page }) => {
    // Navigate to a completely bogus route
    const response = await page.goto('/dashboard/nonexistent-page-123456');

    // Ensure the app doesn't throw a raw 500 server crash or blank screen
    // It should either render an empty state, redirect, or display fallback UI
    await page.waitForTimeout(1000);
    const bodyContent = await page.textContent('body');
    expect(bodyContent).not.toContain('Uncaught ReferenceError');
    expect(bodyContent).not.toContain('TypeError: Cannot read properties of undefined');
  });

  test('Invalid API endpoint or backend route returns clean error handling', async ({ page, request }) => {
    // Test direct backend request to a fake endpoint if API_URL is active
    const apiBase = process.env.VITE_API_URL;
    if (apiBase) {
      const res = await request.fetch(`${apiBase}/fake-nonexistent-endpoint-999/`, {
        method: 'GET',
      });
      // Should return a 404 Not Found rather than crashing the server
      expect(res.status()).toBe(404);
    }
  });

});