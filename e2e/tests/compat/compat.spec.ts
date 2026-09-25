import { expect, test, type Locator, type Page } from '@playwright/test';

const NEXT = 'http://localhost:3100';
const VITE = 'http://localhost:4173';

/** "Today" in every spec: Thursday 24 September 2026, 10:00 in New York. */
const TODAY = new Date('2026-09-24T10:00:00-04:00');

/** Every console error or warning, and every uncaught error, from before the first navigation. */
function watchConsole(page: Page): string[] {
  const messages: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      messages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    messages.push(`pageerror: ${error.message}`);
  });
  return messages;
}

const trigger = (page: Page): Locator => page.locator('button.ric-trigger').first();
const popover = (page: Page): Locator => page.locator('dialog.ric-popover[open]');
const day = (page: Page, label: string): Locator =>
  popover(page).getByRole('button', { name: new RegExp(`^\\w+, ${label}`) });

/** Opens the first picker, retrying the click until hydration has wired it up, but not for long. */
async function openFirstPicker(page: Page): Promise<void> {
  await expect(async () => {
    await trigger(page).click();
    await expect(popover(page)).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 5000 });
}

async function openApp(page: Page, url: string): Promise<void> {
  await page.clock.setFixedTime(TODAY);
  await page.goto(url);
}

for (const [name, url] of [
  ['Next.js App Router', NEXT],
  ['Vite with React 18', VITE],
] as const) {
  test(`${name}: a picker opens and picks a day with no console errors or warnings`, async ({
    page,
  }) => {
    const messages = watchConsole(page);
    await openApp(page, url);
    await openFirstPicker(page);
    await day(page, 'September 10, 2026').click();
    await expect(popover(page)).toHaveCount(0);
    await expect(trigger(page)).toContainText('Sep 10, 2026');
    expect(messages).toEqual([]);
  });
}

test('Next.js App Router: the server HTML already has both picker triggers', async ({
  request,
}) => {
  const response = await request.get(`${NEXT}/`);
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html.split('aria-haspopup="dialog"')).toHaveLength(3);
  expect(html).toContain('Check-in');
  expect(html).toContain('Stay');
});

test('Next.js App Router: a server action receives the picked date', async ({ page }) => {
  const messages = watchConsole(page);
  await openApp(page, `${NEXT}/form`);
  const submit = page.getByRole('button', { name: 'Submit' });
  const received = page.getByTestId('received');

  // Hydrated first: before that, the browser's own validation would report the hidden input.
  await openFirstPicker(page);
  await page.keyboard.press('Escape');
  await expect(popover(page)).toHaveCount(0);

  await submit.click();
  await expect(trigger(page)).toBeFocused();
  await expect(page.locator('.ric-root')).toHaveAttribute('data-invalid');
  await expect(received).toHaveCount(0);

  await openFirstPicker(page);
  await day(page, 'September 24, 2026').click();
  await submit.click();
  await expect(received).toHaveText('Received 2026-09-24');
  expect(messages).toEqual([]);
});
