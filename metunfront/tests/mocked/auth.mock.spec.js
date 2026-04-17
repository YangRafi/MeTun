import { test, expect } from '@playwright/test';

test('MOCK LOGIN - success', async ({ page }) => {

  await page.route('**/api/auth/login', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'fake-token'
      })
    });
  });

  await page.goto('http://localhost:5173');

  await page.click('text=Zaloguj się');

  await page.getByPlaceholder('Podaj email').fill('test@test.com');
  await page.locator('input[type="password"]').first().fill('123456');

  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/dashboard|home|\/$/);
});

test('MOCK LOGIN - invalid credentials', async ({ page }) => {

  await page.route('**/api/auth/login', route => {
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Invalid email or password'
      })
    });
  });

  await page.goto('http://localhost:5173');

  await page.click('text=Zaloguj się');

  await page.getByPlaceholder('Podaj email').fill('bad@test.com');
  await page.locator('input[type="password"]').first().fill('Wrong123');

  await page.click('button[type="submit"]');

  await expect(page.locator('.p-toast-detail')).toContainText('Błąd');
});

test('MOCK LOGIN + DASHBOARD FLOW', async ({ page }) => {

  await page.route('**/api/auth/login', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'fake-token'
      })
    })
  );

  await page.route('**/api/auth/me', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        name: 'Jan',
        role: 'user',
        isVerified: true
      })
    })
  );

  // START
  await page.goto('http://localhost:5173');
    await page.click('text=Zaloguj się');

  // UI login
  await page.getByPlaceholder('Podaj email').fill('test@test.com');
  await page.locator('input[type="password"]').fill('123456');

  await page.click('button[type="submit"]');

  // debug wait (ważne!)
  await page.waitForTimeout(1000);

  // sprawdź gdzie jesteś
  console.log('CURRENT URL:', page.url());

  // jeśli routing działa:
  await expect(page).toHaveURL(/dashboard|\/$/);
});