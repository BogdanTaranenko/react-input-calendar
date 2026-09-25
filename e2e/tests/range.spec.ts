import { expect, test, type Page } from '@playwright/test';
import { day, openFixture, surface, trigger } from './helpers';

const hidden = (page: Page, name: string) => page.locator(`input[type="hidden"][name="${name}"]`);
const preset = (page: Page, name: string) =>
  surface(page)
    .getByRole('group', { name: 'Presets' })
    .getByRole('button', { name, exact: true });

test.describe('DateRangePicker', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'date-range');
  });

  test('shows two months side by side in the popover', async ({ page }) => {
    await trigger(page).click();
    await expect(surface(page).locator('.ric-caption')).toHaveText([
      'September 2026',
      'October 2026',
    ]);
  });

  test('two clicks pick a range, previewing it on hover, then close', async ({ page }) => {
    await trigger(page).click();
    await day(page, 'September 10, 2026').click();
    await expect(surface(page)).toBeVisible();
    await expect(hidden(page, 'from')).toHaveValue('2026-09-10');
    await expect(hidden(page, 'to')).toHaveValue('');

    await day(page, 'September 15, 2026').hover();
    await expect(surface(page).locator('td[data-preview]')).not.toHaveCount(0);

    await day(page, 'September 15, 2026').click();
    await expect(surface(page)).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
    await expect(hidden(page, 'from')).toHaveValue('2026-09-10');
    await expect(hidden(page, 'to')).toHaveValue('2026-09-15');
    await expect(trigger(page)).toContainText('10');
    await expect(trigger(page)).toContainText('15');
  });

  test('a range can span the two visible months', async ({ page }) => {
    await trigger(page).click();
    await day(page, 'September 28, 2026').click();
    await day(page, 'October 3, 2026').click();
    await expect(hidden(page, 'from')).toHaveValue('2026-09-28');
    await expect(hidden(page, 'to')).toHaveValue('2026-10-03');
  });

  test('a relative preset picks its range and closes', async ({ page }) => {
    await trigger(page).click();
    await preset(page, 'Last 7 days').click();
    await expect(surface(page)).toHaveCount(0);
    await expect(hidden(page, 'from')).toHaveValue('2026-09-18');
    await expect(hidden(page, 'to')).toHaveValue('2026-09-24');
  });

  test('the preset matching the value is pressed', async ({ page }) => {
    await trigger(page).click();
    await preset(page, 'October').click();
    await expect(hidden(page, 'to')).toHaveValue('2026-10-31');
    await trigger(page).click();
    await expect(preset(page, 'October')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(preset(page, 'Last 7 days')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
