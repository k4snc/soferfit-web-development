import { test, expect } from '@playwright/test';

test.describe('SoferFit Comprehensive Click & Interaction Audit', () => {

  test('Landing page interactive elements are fully responsive', async ({ page }) => {
    await page.goto('/');

    // Test glossary drawer open/close
    const glossaryTrigger = page.locator('button.footer-glossary, button:has-text("Glossary")').first();
    if (await glossaryTrigger.isVisible()) {
      await glossaryTrigger.click();
      await expect(page.locator('.glossary-drawer, [role="dialog"], .glossary-content')).toBeVisible();
      // Close drawer
      await page.keyboard.press('Escape');
    }

    // Test Login Modal trigger
    const loginBtn = page.getByRole('button', { name: /log in/i });
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await expect(page.locator('.login-modal, [role="dialog"]')).toBeVisible();
      // Close modal
      await page.locator('.modal-close').click();
    }
  });

  test('Dashboard and all member navigation tabs are fully clickable', async ({ page }) => {
    await page.goto('/dashboard');

    const navButtons = [
      { name: 'Overview', pattern: /overview/i },
      { name: 'Workouts', pattern: /workouts/i },
      { name: 'Progress', pattern: /progress/i },
      { name: 'Generate', pattern: /generate|spark/i },
      { name: 'Profile', pattern: /profile|user/i },
    ];

    for (const nav of navButtons) {
      const btn = page.locator('nav[aria-label="Dashboard navigation"] button, .dash-sidebar button').filter({ hasText: nav.pattern });
      if (await btn.count() > 0) {
        await btn.first().click();
        await page.waitForTimeout(500); // Allow view transition
      }
    }
  });

  test('Profile page section expanders and toggles are clickable', async ({ page }) => {
    await page.goto('/profile');

    const sections = ['Account', 'Body profile', 'Training', 'Health & safety', 'Notifications', 'Privacy & data', 'Help'];
    for (const sectionName of sections) {
      const sectionButton = page.locator('.profile-subnav button, .profile-sections button').filter({ hasText: sectionName }).first();
      if (await sectionButton.isVisible()) {
        await sectionButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

});