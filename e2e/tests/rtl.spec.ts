import { expect, test } from '@playwright/test';
import { openFixture, surface, trigger } from './helpers';

test.describe('right-to-left (ar)', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'rtl');
    await trigger(page).click();
  });

  test('the layout is mirrored', async ({ page }) => {
    const firstWeek = surface(page).locator('.ric-week').first().locator('td');
    const first = await firstWeek.first().boundingBox();
    const last = await firstWeek.last().boundingBox();
    expect(first && last && first.x > last.x).toBe(true);

    const nav = surface(page).locator('.ric-nav-button');
    const previous = await nav.first().boundingBox();
    const next = await nav.last().boundingBox();
    expect(previous && next && previous.x > next.x).toBe(true);
  });

  test('ArrowLeft moves to the next day and ArrowRight to the previous one', async ({ page }) => {
    const focusedIndex = () =>
      surface(page)
        .locator('td[role="gridcell"]')
        .evaluateAll((cells) => cells.findIndex((cell) => cell.hasAttribute('data-focused')));
    const start = await focusedIndex();
    expect(start).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('ArrowLeft');
    expect(await focusedIndex()).toBe(start + 1);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    expect(await focusedIndex()).toBe(start - 1);
  });
});
