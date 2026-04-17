import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/auth/storageState.json' });

test('STATE 1 - dashboard visible', async ({ page }) => {
  await page.goto('http://localhost:5173/dashboard');

  await expect(page).toHaveURL(/dashboard/);
});

test('STATE 2 - groups accessible', async ({ page }) => {
  await page.goto('http://localhost:5173/groups');

  await expect(page).toHaveURL(/groups/);
});

test('STATE 3 - matches accessible', async ({ page }) => {
  await page.goto('http://localhost:5173/matches');

  await expect(page).toHaveURL(/matches/);
});