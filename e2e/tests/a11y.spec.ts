import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { FIXTURES, openFixture, settled, surface, trigger } from './helpers';

for (const name of FIXTURES) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${name} has no axe violations in ${colorScheme}, closed and open`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await openFixture(page, name);
      expect((await new AxeBuilder({ page }).analyze()).violations, 'closed').toEqual([]);

      if ((await trigger(page).count()) === 0) return;
      await trigger(page).click();
      await expect(surface(page)).toBeVisible();
      await settled(page);
      expect((await new AxeBuilder({ page }).analyze()).violations, 'open').toEqual([]);
    });
  }
}
