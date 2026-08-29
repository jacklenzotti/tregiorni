import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('app loads with the trip header', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Tre Giorni' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Day 1/ })).toBeVisible();
});

test('explore catalog shows a healthy pile of places', async ({ page }) => {
  await expect(page.locator('.place-card').first()).toBeVisible();
  expect(await page.locator('.place-card').count()).toBeGreaterThanOrEqual(20);
});

test('adding a place puts a stop on day 1', async ({ page }) => {
  const firstCard = page.locator('.place-card').first();
  const name = await firstCard.locator('strong').innerText();
  await firstCard.getByRole('button', { name: '+ Day 1' }).click();
  const dayOne = page.locator('section.day').first();
  await expect(dayOne.locator('.stop')).toHaveCount(1);
  await expect(dayOne.locator('.stop strong').first()).toHaveText(name);
});

test('auto-plan fills all three days', async ({ page }) => {
  await page.getByRole('button', { name: 'Auto-plan trip' }).click();
  const days = await page.locator('section.day').all();
  expect(days).toHaveLength(3);
  for (const day of days) {
    await expect(day.locator('.stop').first()).toBeVisible();
  }
});

test('map renders markers for planned stops', async ({ page }) => {
  await page.getByRole('button', { name: 'Auto-plan trip' }).click();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible();
  expect(await page.locator('.leaflet-marker-icon').count()).toBeGreaterThanOrEqual(3);
});
