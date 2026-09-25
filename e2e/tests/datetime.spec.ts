import { expect, test, type Page } from '@playwright/test';
import { day, openFixture, surface, trigger } from './helpers';

const hidden = (page: Page) => page.locator('input[type="hidden"][name="meeting"]');
const option = (page: Page, column: string, label: string) =>
  surface(page)
    .getByRole('listbox', { name: column })
    .getByRole('option', { name: label, exact: true });

test.describe('DateTimePicker', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'date-time');
  });

  test('a first day gets the current time, rounded to the step', async ({ page }) => {
    await trigger(page).click();
    await day(page, 'September 24, 2026').click();
    await expect(surface(page)).toBeVisible();
    await expect(hidden(page)).toHaveValue('2026-09-24T10:00');
  });

  test('hours, minutes and AM/PM commit at once; Done closes', async ({ page }) => {
    await trigger(page).click();
    await day(page, 'September 24, 2026').click();
    await option(page, 'Hours', '02').click();
    await option(page, 'AM/PM', 'PM').click();
    await option(page, 'Minutes', '30').click();
    await expect(hidden(page)).toHaveValue('2026-09-24T14:30');
    await expect(option(page, 'Minutes', '30')).toHaveAttribute('aria-selected', 'true');

    await surface(page).getByRole('button', { name: 'Done' }).click();
    await expect(surface(page)).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
    await expect(trigger(page)).toContainText('2:30');
    await expect(trigger(page)).toContainText('PM');
  });

  test('a new day keeps the picked time', async ({ page }) => {
    await trigger(page).click();
    await day(page, 'September 24, 2026').click();
    await option(page, 'Minutes', '45').click();
    await day(page, 'September 25, 2026').click();
    await expect(hidden(page)).toHaveValue('2026-09-25T10:45');
  });

  test('Escape closes and keeps the committed value', async ({ page }) => {
    await trigger(page).click();
    await day(page, 'September 24, 2026').click();
    await page.keyboard.press('Escape');
    await expect(surface(page)).toHaveCount(0);
    await expect(hidden(page)).toHaveValue('2026-09-24T10:00');
  });
});
