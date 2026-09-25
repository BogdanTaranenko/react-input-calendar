import { expect, test, type Page } from '@playwright/test';
import {
  caption,
  day,
  openFixture,
  settled,
  surface,
  trigger,
  type FixtureName,
} from './helpers';

const sheet = (page: Page) => surface(page).locator('.ric-sheet');

/** A primary-pointer drag through the browser's real input pipeline. */
async function drag(page: Page, from: { x: number; y: number }, dx: number, dy: number) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + dx, from.y + dy, { steps: 8 });
  await page.mouse.up();
}

/** Measured once the surface stops moving, so the press lands where it was aimed. */
async function centreOf(page: Page, selector: string) {
  await settled(page);
  const box = await surface(page).locator(selector).first().boundingBox();
  if (!box) throw new Error(`${selector} has no box`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, height: box.height };
}

test.describe('bottom sheet', () => {
  test('opens as a sheet with a backdrop and a handle below 640 px', async ({ page }) => {
    await openFixture(page, 'date-picker');
    expect(page.viewportSize()?.width).toBeLessThan(640);
    await trigger(page).click();
    await expect(surface(page)).toHaveClass(/ric-backdrop/);
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).locator('.ric-sheet-handle')).toBeVisible();
    await expect(page.locator('dialog.ric-popover')).toHaveCount(0);
  });

  const TARGET_FIXTURES: FixtureName[] = ['date-picker', 'date-range', 'multi-date', 'date-time'];
  for (const name of TARGET_FIXTURES) {
    test(`every control in the ${name} sheet is at least 44×44`, async ({ page }) => {
      await openFixture(page, name);
      await trigger(page).click();
      await expect(sheet(page)).toBeVisible();
      const controls = sheet(page).locator('button:visible, [role="option"]:visible');
      expect(await controls.count()).toBeGreaterThan(0);
      const small = await controls.evaluateAll((elements) =>
        elements
          .map((el) => ({ el, box: el.getBoundingClientRect() }))
          .filter(({ box }) => box.width < 44 - 0.5 || box.height < 44 - 0.5)
          .map(
            ({ el, box }) =>
              `${el.getAttribute('aria-label') ?? el.textContent ?? el.className}: ` +
              `${box.width.toFixed(1)}×${box.height.toFixed(1)}`,
          ),
      );
      expect(small).toEqual([]);
    });
  }

  test('a horizontal swipe on the grid changes the month', async ({ page }) => {
    await openFixture(page, 'date-picker');
    await trigger(page).click();
    await expect(caption(page)).toHaveText('September 2026');
    const grid = await centreOf(page, '.ric-months');
    await drag(page, grid, -150, 0);
    await expect(caption(page)).toHaveText('October 2026');
    await drag(page, grid, 150, 0);
    await expect(caption(page)).toHaveText('September 2026');
  });

  test('dragging the handle down closes the sheet', async ({ page }) => {
    await openFixture(page, 'date-picker');
    await trigger(page).click();
    const handle = await centreOf(page, '.ric-sheet-handle');
    const panel = await centreOf(page, '.ric-sheet');
    await drag(page, handle, 0, panel.height * 0.5);
    await expect(surface(page)).toHaveCount(0);
  });

  test('a short drag on the handle springs back', async ({ page }) => {
    await openFixture(page, 'date-picker');
    await trigger(page).click();
    const handle = await centreOf(page, '.ric-sheet-handle');
    await drag(page, handle, 0, 20);
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page)).toHaveCSS('transform', 'none');
  });

  test('a tap on the backdrop closes the sheet', async ({ page }) => {
    await openFixture(page, 'date-picker');
    await trigger(page).click();
    await expect(sheet(page)).toBeVisible();
    await page.touchscreen.tap(20, 20);
    await expect(surface(page)).toHaveCount(0);
  });

  test('page scroll is locked while open and restored after', async ({ page }) => {
    await openFixture(page, 'date-picker');
    const overflow = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    const before = await overflow();
    await trigger(page).click();
    await expect(sheet(page)).toBeVisible();
    expect(await overflow()).toBe('hidden');
    await day(page, 'September 24, 2026').click();
    await expect(surface(page)).toHaveCount(0);
    expect(await overflow()).toBe(before);
  });

  test('a range shows one month and its presets as a chip row', async ({ page }) => {
    await openFixture(page, 'date-range');
    await trigger(page).click();
    await expect(sheet(page).locator('.ric-caption')).toHaveCount(1);
    await sheet(page)
      .getByRole('group', { name: 'Presets' })
      .getByRole('button', { name: 'October', exact: true })
      .tap();
    await expect(surface(page)).toHaveCount(0);
    await expect(page.locator('input[type="hidden"][name="to"]')).toHaveValue('2026-10-31');
  });
});
