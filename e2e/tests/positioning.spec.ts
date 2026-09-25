import { expect, test } from '@playwright/test';
import { day, openFixture, settled, surface, trigger } from './helpers';

const boxes = async (page: import('@playwright/test').Page) => {
  await settled(page);
  const [anchor, popover] = await Promise.all([
    trigger(page).boundingBox(),
    surface(page).boundingBox(),
  ]);
  if (!anchor || !popover) throw new Error('missing box');
  return { anchor, popover };
};

test.describe('popover positioning', () => {
  test('opens below the trigger when there is room', async ({ page }) => {
    await openFixture(page, 'date-picker');
    await trigger(page).click();
    const { anchor, popover } = await boxes(page);
    expect(popover.y).toBeGreaterThanOrEqual(anchor.y + anchor.height);
  });

  test('flips above the trigger near the bottom of the viewport', async ({ page }) => {
    await openFixture(page, 'scroll');
    await trigger(page).click();
    const { anchor, popover } = await boxes(page);
    // Exactly the 8px offset above (±1 for whole-pixel sizes): a popover sized mid-animation
    // lands anywhere from 5 to 14px low, which "not overlapping" alone would sometimes let pass.
    expect(Math.abs(anchor.y - (popover.y + popover.height) - 8)).toBeLessThanOrEqual(1);
  });

  test('follows the trigger when its scroll container scrolls', async ({ page }) => {
    await openFixture(page, 'scroll');
    await trigger(page).click();
    const before = await boxes(page);
    const gap = before.anchor.y - before.popover.y;

    await page.getByTestId('scroller').evaluate((el) => {
      el.scrollTop = 40;
    });
    await expect
      .poll(async () => {
        const after = await boxes(page);
        return Math.round(after.anchor.y - after.popover.y);
      })
      .toBe(Math.round(gap));
    const after = await boxes(page);
    expect(after.anchor.y).toBeCloseTo(before.anchor.y - 40, 0);
  });

  test("works inside a consumer's modal dialog", async ({ page }) => {
    await openFixture(page, 'in-dialog');
    await expect(page.getByRole('dialog', { name: 'Booking' })).toBeVisible();
    await trigger(page).click();
    await day(page, 'September 10, 2026').click();
    await expect(surface(page)).toHaveCount(0);
    await expect(trigger(page)).toContainText('Sep 10, 2026');
    await expect(trigger(page)).toBeFocused();
    await expect(page.getByRole('dialog', { name: 'Booking' })).toBeVisible();
  });
});
