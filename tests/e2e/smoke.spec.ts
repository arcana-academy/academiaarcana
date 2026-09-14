import { expect, test } from '@playwright/test';

test('landing page loads with the Academia Arcana heading', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Academia Arcana/i);
  await expect(page.getByRole('main')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Academia Arcana', level: 1 }),
  ).toBeVisible();
});
