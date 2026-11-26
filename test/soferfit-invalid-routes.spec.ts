import { test, expect } from '@playwright/test';

test.describe('SoferFit Invalid URL & Fallback Routing', () => {

  test('unknown dashboard routes display a not-found page', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('soferfit-member', JSON.stringify({
        id: 'route-test-member',
        email: 'route-test@example.test',
        createdAt: new Date().toISOString(),
      }));
    });

    await page.goto('/dashboard/nonexistent-page-123456');

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go to dashboard' })).toBeVisible();
  });

  test('malformed workout-session URLs display a recoverable not-found page', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('soferfit-member', JSON.stringify({
        id: 'route-test-member',
        email: 'route-test@example.test',
        createdAt: new Date().toISOString(),
      }));
    });

    await page.goto('/dashboard');
    await page.evaluate(() => {
      window.history.pushState({}, '', '/session/%E0%A4');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await expect(page.getByRole('heading', { name: 'Workout not found' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to workouts' })).toBeVisible();
  });

  test('Invalid API endpoint or backend route returns clean error handling', async ({ page, request }) => {
    const apiBase = process.env.VITE_API_URL;
    if (apiBase) {
      const res = await request.fetch(`${apiBase}/fake-nonexistent-endpoint-999/`, {
        method: 'GET',
      });
      expect(res.status()).toBe(404);
    }
  });

});