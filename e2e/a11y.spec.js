const AxeBuilder = require('@axe-core/playwright').default;
const { expect, test } = require('@playwright/test');
const { mockApi } = require('./mock');

// automatic accessibility check (contrast, labels, names...) on the home screen and on a
// city's forecast, in light and dark mode

async function audit(page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  return result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
}

for (const scheme of ['light', 'dark']) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });

    test('no accessibility problems on the home screen', async ({ page }) => {
      await mockApi(page);
      await page.goto('/');
      expect(await audit(page)).toEqual([]);
    });

    test('no accessibility problems on the forecast', async ({ page }) => {
      await mockApi(page);
      await page.goto('/');
      await page.getByRole('button', { name: 'Recife' }).click();
      await expect(page.locator('.temp')).toBeVisible();
      expect(await audit(page)).toEqual([]);
    });
  });
}
