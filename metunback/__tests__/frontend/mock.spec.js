import { test, expect } from '@playwright/test';

test('Mock login API', async ({ page }) => {

  await page.route('**/api/auth/login', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        accessToken: 'fake-token',
        refreshToken: 'fake-token'
      })
    });
  });

  await page.goto('http://localhost:5173/login');

  await page.fill('input[name="email"]', 'test@test.com');
  await page.fill('input[name="password"]', '123456');

  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/dashboard/);
});

test('Mock tasks list', async ({ page }) => {

  await page.route('**/api/tasks', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify([
        { id: 1, name: 'Mock task' }
      ])
    });
  });

  await page.goto('http://localhost:5173/tasks');

  await expect(page.locator('text=Mock task')).toBeVisible();
});

test('Mock user profile', async ({ page }) => {

  await page.route('**/api/auth/me', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        name: 'Test User'
      })
    });
  });

  await page.goto('http://localhost:5173/profile');

  await expect(page.locator('text=Test User')).toBeVisible();
});