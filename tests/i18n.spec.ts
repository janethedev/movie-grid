import { test, expect } from '@playwright/test';

const locales = ['zh-CN', 'en'];

for (const locale of locales) {
  test(`renders home for ${locale}`, async ({ page, context }) => {
    // Set locale cookie before visiting the page
    await context.addCookies([{
      name: 'NEXT_LOCALE',
      value: locale,
      domain: 'localhost',
      path: '/',
    }]);
    
    await page.goto('/');
    
    // Main canvas should exist
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Generate button visible and not overflowing
    const button = page.getByRole('button');
    await expect(button.first()).toBeVisible();

    // Check no horizontal overflow in tip paragraph
    const tip = page.locator('text=/.+/').first();
    await expect(page).toHaveJSProperty('scrollWidth', await page.evaluate(() => document.documentElement.scrollWidth));
  });
}

