import { test, expect } from '@playwright/test';

const locales = ['zh-CN','zh-TW','en','ja','ko','fr','de','es','pt','it','ru','nl','pl','tr'];

for (const locale of locales) {
  test(`renders home for ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
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

