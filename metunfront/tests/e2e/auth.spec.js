import { test, expect } from '@playwright/test';


test('TC1 - Rejestracja użytkownika poprawnymi danymi', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.click('text=Utwórz konto');

    await page.locator('input[type="text"]').first().fill('Jan');

    await page.locator('input[type="text"]').nth(1).fill('Kowalski');

    await page.getByPlaceholder('Podaj email').fill(`test${Date.now()}@test.com`);

    await page.locator('input[type="password"]').first().fill('Test123');

    await page.locator('input[type="password"]').nth(1).fill('Test123');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Sukces')).toBeVisible();
    await expect(page.locator('text=Rejestracja zakończona pomyślnie')).toBeVisible();
});

test('TC3 - Logowanie użytkownika poprawnymi danymi', async ({ page }) => {
    await page.goto('localhost:5173');

    await page.click('text=Zaloguj się');

    await page.getByPlaceholder('Podaj email').fill('test@test.com');

    await page.locator('input[type="password"]').first().fill('Test123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard|home|\/$/);
});

test('TC4 - Logowanie niepoprawnym hasłem', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.click('text=Zaloguj się');

    await page.getByPlaceholder('Podaj email').fill('test@test.com');

    await page.locator('input[type="password"]').first().fill('zlehaslo123');

    await page.click('button[type="submit"]');

    const toast = page.locator('.p-toast');

    await expect(page.locator('text=Błąd')).toBeVisible();
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
});