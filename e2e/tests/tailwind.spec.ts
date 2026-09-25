import { expect, test } from '@playwright/test';
import { openFixture } from './helpers';

test.describe('Tailwind v4 with the documented layer order', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'tailwind');
  });

  test('Tailwind is active on the page', async ({ page }) => {
    await expect(page.locator('main > div').first()).toHaveCSS('display', 'flex');
  });

  test('preflight does not reset the library trigger', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Library look/ });
    // The trigger's radius is two thirds of --ric-radius (12px); preflight would make it 0.
    await expect(trigger).toHaveCSS('border-radius', '8px');
    await expect(trigger).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('a utility passed through classNames wins over the library', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /Utility override/ });
    await expect(trigger).toHaveCSS('border-radius', '0px');
  });
});
