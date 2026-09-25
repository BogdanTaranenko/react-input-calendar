import { expect, test, type Page } from '@playwright/test';
import { day, openFixture, surface, trigger } from './helpers';

const submitted = (page: Page) =>
  page.locator('input[type="hidden"][name="days"]').evaluateAll((inputs) =>
    inputs.map((input) => (input as HTMLInputElement).value),
  );

test.describe('MultiDatePicker', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'multi-date');
  });

  test('toggles days while staying open, then closes on Done', async ({ page }) => {
    await trigger(page).click();
    for (const date of ['September 17, 2026', 'September 3, 2026', 'September 10, 2026']) {
      await day(page, date).click();
    }
    await expect(surface(page)).toBeVisible();
    await expect(surface(page).locator('td[aria-selected="true"]')).toHaveCount(3);
    expect(await submitted(page)).toEqual(['2026-09-03', '2026-09-10', '2026-09-17']);

    await day(page, 'September 10, 2026').click();
    expect(await submitted(page)).toEqual(['2026-09-03', '2026-09-17']);

    await surface(page).getByRole('button', { name: 'Done' }).click();
    await expect(surface(page)).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
    await expect(trigger(page)).toContainText('Sep 3');
    await expect(trigger(page)).toContainText('Sep 17');
  });

  test('the grid is multiselectable and the keyboard toggles days', async ({ page }) => {
    await trigger(page).click();
    await expect(surface(page).getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press(' ');
    expect(await submitted(page)).toEqual(['2026-09-24', '2026-09-25']);
  });

  test('Clear empties the value', async ({ page }) => {
    await trigger(page).click();
    await day(page, 'September 3, 2026').click();
    await surface(page).getByRole('button', { name: 'Done' }).click();
    await page.getByRole('button', { name: 'Clear' }).click();
    expect(await submitted(page)).toEqual([]);
    await expect(trigger(page)).toBeFocused();
  });
});
