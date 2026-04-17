import { test as setup } from '@playwright/test';

setup('authenticate user', async ({ page }) => {

  // mock backend
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

  await page.goto('http://localhost:5173');

  // 🔥 KLUCZ: ustaw to, co app REALNIE czyta
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token');

    // jeśli masz user context:
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      name: 'Jan',
      role: 'user'
    }));
  });

  // 🔥 NIE czekaj na dashboard (bo router może nie reagować)
  await page.waitForTimeout(500);

  // zapis state
  await page.context().storageState({
    path: 'tests/auth/storageState.json'
  });
});