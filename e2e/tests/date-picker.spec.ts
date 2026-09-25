import { expect, test } from '@playwright/test';
import { caption, day, focusedLabel, openFixture, surface, trigger } from './helpers';

test.describe('DatePicker', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'date-picker');
  });

  test('the trigger advertises and reflects the dialog', async ({ page }) => {
    await expect(trigger(page)).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await trigger(page).click();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(surface(page)).toHaveAttribute('aria-modal', 'true');
  });

  test('opens on today with today focused and marked current', async ({ page }) => {
    await trigger(page).click();
    await expect(caption(page)).toHaveText('September 2026');
    await expect(day(page, 'September 24, 2026')).toBeFocused();
    await expect(day(page, 'September 24, 2026')).toHaveAttribute('aria-current', 'date');
  });

  test('arrow keys, Home/End and Page keys move the focused day', async ({ page }) => {
    await trigger(page).click();
    const moves: [string, RegExp][] = [
      ['ArrowRight', /^Friday, September 25, 2026/],
      ['ArrowLeft', /^Thursday, September 24, 2026/],
      ['ArrowDown', /^Thursday, October 1, 2026/],
      ['ArrowUp', /^Thursday, September 24, 2026/],
      ['Home', /^Sunday, September 20, 2026/],
      ['End', /^Saturday, September 26, 2026/],
      ['PageDown', /^Monday, October 26, 2026/],
      ['PageUp', /^Saturday, September 26, 2026/],
      ['Shift+PageDown', /^Sunday, September 26, 2027/],
      ['Shift+PageUp', /^Saturday, September 26, 2026/],
    ];
    for (const [key, label] of moves) {
      await page.keyboard.press(key);
      expect(await focusedLabel(page), key).toMatch(label);
    }
    await expect(caption(page)).toHaveText('September 2026');
  });

  test('Enter selects, closes and returns focus to the trigger', async ({ page }) => {
    await trigger(page).click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(surface(page)).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
    await expect(trigger(page)).toContainText('Sep 25, 2026');
  });

  test('Space selects too', async ({ page }) => {
    await trigger(page).click();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press(' ');
    await expect(trigger(page)).toContainText('Sep 23, 2026');
  });

  test('Escape closes without selecting and returns focus', async ({ page }) => {
    await trigger(page).click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(surface(page)).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
    await expect(trigger(page)).not.toContainText('Sep 25');
  });

  test('Tab stays inside the open dialog', async ({ page }) => {
    await trigger(page).click();
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await surface(page).evaluate((el) => el.contains(document.activeElement));
      expect(inside, `after ${String(i + 1)} Tab presses`).toBe(true);
    }
  });

  test('a click on a day selects it', async ({ page }) => {
    await trigger(page).click();
    await day(page, 'September 10, 2026').click();
    await expect(trigger(page)).toContainText('Sep 10, 2026');
  });

  test('the month change is announced politely', async ({ page }) => {
    await trigger(page).click();
    await surface(page).getByRole('button', { name: 'Next month' }).click();
    await expect(caption(page)).toHaveText('October 2026');
    await expect(surface(page).locator('[aria-live="polite"]')).toContainText('October 2026');
  });
});

test.describe('DatePicker in a native form', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'form');
  });

  test('an empty required picker blocks submit and focuses the trigger', async ({ page }) => {
    const url = page.url();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(trigger(page)).toBeFocused();
    await expect(page.locator('.ric-root')).toHaveAttribute('data-invalid');
    await expect(page.locator('output')).toHaveCount(0);
    expect(page.url()).toBe(url);
  });

  test('a picked day submits as YYYY-MM-DD', async ({ page }) => {
    await trigger(page).click();
    await day(page, 'September 24, 2026').click();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('output')).toHaveText('Submitted 2026-09-24');
    await expect(page.locator('.ric-root')).not.toHaveAttribute('data-invalid');
  });
});
