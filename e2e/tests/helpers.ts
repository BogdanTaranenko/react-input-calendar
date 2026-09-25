import { expect, type Locator, type Page } from '@playwright/test';

/** "Today" in every spec: Thursday 24 September 2026, 10:00 in New York. */
export const TODAY = new Date('2026-09-24T10:00:00-04:00');

/** Every fixture route in `app/fixtures/index.ts`. */
export const FIXTURES = [
  'date-picker',
  'date-range',
  'multi-date',
  'date-time',
  'field',
  'disabled',
  'min-max',
  'rtl',
  'dark-prop',
  'dark-ancestor',
  'accent-ancestor',
  'scroll',
  'in-dialog',
  'form',
  'tailwind',
] as const;
export type FixtureName = (typeof FIXTURES)[number];

export async function openFixture(page: Page, name: FixtureName): Promise<void> {
  await page.clock.setFixedTime(TODAY);
  await page.goto(`/#/${name}`);
  await expect(page.locator('.ric-root').first()).toBeVisible();
}

/** The first trigger that can open, e.g. `getByRole` would also find disabled ones. */
export const trigger = (page: Page): Locator =>
  page.locator('button.ric-trigger:not([disabled])').first();

/** The picker's open surface: the popover, or the bottom sheet's backdrop dialog. */
export const surface = (page: Page): Locator =>
  page.locator('dialog.ric-popover[open], dialog.ric-backdrop[open]');

/** A day button by the start of its label, e.g. `day(page, 'September 24, 2026')`. */
export const day = (page: Page, label: string): Locator =>
  surface(page).getByRole('button', { name: new RegExp(`^\\w+, ${label}`) });

export const caption = (page: Page): Locator => surface(page).locator('.ric-caption').first();

/** The `aria-label` of the focused element. */
export const focusedLabel = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? null);

/** Waits for the surface's running animations (sheet slide-in, month slide) to finish. */
export const settled = (page: Page): Promise<void> =>
  surface(page).evaluate(async (el) => {
    await Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished));
  });
