import { expect, test, type Locator, type Page } from '@playwright/test';
import { day, openFixture, surface, trigger, type FixtureName } from './helpers';

const selectedDay = (page: Page) =>
  surface(page).locator('td[data-selected] > .ric-day-button').first();

const background = (locator: Locator) =>
  locator.evaluate((el) => getComputedStyle(el).backgroundColor);

/** `var(--ric-accent)` resolved at `locator`, in the same colour syntax as a computed background. */
const accentAt = (locator: Locator) =>
  locator.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.background = 'var(--ric-accent)';
    el.append(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  });

async function openSurfaceBackground(page: Page, name: FixtureName) {
  await openFixture(page, name);
  await trigger(page).click();
  return background(surface(page));
}

test.describe('default theme', () => {
  test('the popover is rounded 12px with a shadow', async ({ page }) => {
    await openFixture(page, 'date-picker');
    await trigger(page).click();
    await expect(surface(page)).toHaveCSS('border-radius', '12px');
    expect(await surface(page).evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  });

  test('the selected day is filled with the accent', async ({ page }) => {
    await openFixture(page, 'date-picker');
    await trigger(page).click();
    await day(page, 'September 24, 2026').click();
    await trigger(page).click();
    const cell = selectedDay(page);
    expect(await background(cell)).toBe(await accentAt(cell));
  });

  test('the surface follows prefers-color-scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const light = await openSurfaceBackground(page, 'date-picker');
    await page.emulateMedia({ colorScheme: 'dark' });
    const dark = await background(surface(page));
    expect(dark).not.toBe(light);
  });
});

test.describe('forced schemes and ancestor tokens', () => {
  test('an ancestor data-ric-theme="dark" darkens the open popover', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const light = await openSurfaceBackground(page, 'date-picker');
    const forced = await openSurfaceBackground(page, 'dark-ancestor');
    await page.emulateMedia({ colorScheme: 'dark' });
    const systemDark = await openSurfaceBackground(page, 'date-picker');
    expect(forced).not.toBe(light);
    expect(forced).toBe(systemDark);
  });

  test('colorScheme="dark" darkens the open popover', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const light = await openSurfaceBackground(page, 'date-picker');
    const forced = await openSurfaceBackground(page, 'dark-prop');
    expect(forced).not.toBe(light);
  });

  test('an ancestor --ric-accent colours the selected day inside the popover', async ({ page }) => {
    await openFixture(page, 'accent-ancestor');
    await trigger(page).click();
    await expect(selectedDay(page)).toHaveCSS('background-color', 'rgb(204, 0, 0)');
  });

  test('an ancestor --ric-accent also drives the colours mixed from it', async ({ page }) => {
    await openFixture(page, 'accent-ancestor');
    await trigger(page).click();
    const hovered = day(page, 'September 10, 2026');
    await hovered.hover();
    const expected = await hovered.evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.background = 'color-mix(in oklab, rgb(204 0 0) 10%, transparent)';
      el.append(probe);
      const colour = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return colour;
    });
    await expect(hovered).toHaveCSS('background-color', expected);
  });
});

test.describe('motion and layers', () => {
  test('the popover animates in, unless reduced motion is asked for', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFixture(page, 'date-picker');
    await trigger(page).click();
    await expect(surface(page)).toHaveCSS('animation-name', 'ric-pop-in');
    await page.keyboard.press('Escape');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await trigger(page).click();
    await expect(surface(page)).toHaveCSS('animation-name', 'none');
  });

  test('every top-level rule of the library stylesheet is a layer', async ({ page }) => {
    await openFixture(page, 'date-picker');
    const rules = await page.evaluate(() => {
      const sheet = [...document.styleSheets].find((candidate) =>
        (candidate.ownerNode as Element | null)
          ?.getAttribute('data-vite-dev-id')
          ?.endsWith('react-input-calendar/dist/styles.css'),
      );
      if (!sheet) return null;
      return [...sheet.cssRules].map((rule) => rule.constructor.name);
    });
    expect(rules).not.toBeNull();
    expect(rules?.length).toBeGreaterThan(0);
    for (const name of rules ?? []) {
      expect(['CSSLayerBlockRule', 'CSSLayerStatementRule']).toContain(name);
    }
  });
});
