const { expect, test } = require('@playwright/test');
const { mockApi } = require('./mock');

test('home screen has the search and the Brazilian cities', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: "What's the weather like?" })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Recife' })).toBeVisible();
});

test('searches a city by name', async ({ page }) => {
  const calls = await mockApi(page);
  await page.goto('/');
  await page.getByRole('combobox', { name: 'City' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('heading', { name: /São Paulo/ }).first()).toBeVisible();
  await expect(page.locator('.temp')).toHaveText('18°C');
  await expect(page.locator('.current .description')).toHaveText('Overcast clouds');
  expect(calls).toEqual(['city=S%C3%A3o+Paulo']);
});

test('suggests cities while typing and picks one with the keyboard', async ({ page }) => {
  const calls = await mockApi(page);
  await page.goto('/');
  const input = page.getByRole('combobox', { name: 'City' });
  await input.fill('sao');
  await expect(page.getByRole('option', { name: /São Paulo/ })).toBeVisible();

  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page.locator('.temp')).toHaveText('18°C');
  // picked from the list: it searches by coordinates, not by the typed text
  expect(calls[0]).toContain('lat=');
});

test('switches between °C and °F, and remembers it', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Recife' }).click();
  await expect(page.locator('.temp')).toHaveText('18°C');

  await page.getByRole('button', { name: '°F' }).click();
  await expect(page.locator('.temp')).toHaveText('65°F');
  await page.reload();
  await expect(page.locator('.temp')).toHaveText('65°F');
});

test('keeps recent cities and opens on the last one', async ({ page }) => {
  const calls = await mockApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Recife' }).click();
  await expect(page.locator('.recent')).toContainText('São Paulo');

  await page.reload();
  await expect(page.locator('.temp')).toBeVisible();
  expect(calls.length).toBe(2);

  await page.getByRole('button', { name: 'clear' }).click();
  await expect(page.locator('.recent')).toHaveCount(0);
});

test('shows a skeleton while loading', async ({ page }) => {
  await mockApi(page, { delay: 1500 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Recife' }).click();
  await expect(page.getByLabel('Loading the weather')).toBeVisible();
  await expect(page.locator('.temp')).toBeVisible();
  await expect(page.getByLabel('Loading the weather')).toHaveCount(0);
});

test('shows the error from the server', async ({ page }) => {
  await mockApi(page, { fail: true });
  await page.goto('/');
  await page.getByRole('combobox', { name: 'City' }).fill('Nowhere');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.locator('.error')).toHaveText('City not found.');
});
