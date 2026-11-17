import { API_URL, expect, test } from './fixtures';

test('A1: login restores the protected path, the session survives reload, logout ends it', async ({
  page,
  account,
}) => {
  const protectedPath = '/app/rolls?tab=in_stock';
  await page.goto(protectedPath);

  // anonymous visit lands on login and keeps the original location
  await expect(page).toHaveURL(/\/auth\/login/);
  expect(new URL(page.url()).searchParams.get('redirect')).toContain(protectedPath);

  await page.getByRole('textbox', { name: 'Email' }).fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(
    (url) => url.pathname === '/app/rolls' && url.searchParams.get('tab') === 'in_stock',
  );

  // reload: the cookie alone identifies the account
  const meResponse = page.waitForResponse(
    (response) => response.url() === `${API_URL}/auth/me` && response.request().method() === 'GET',
  );
  await page.reload();
  const me = await meResponse;
  expect(me.status()).toBe(200);
  expect((await me.json()).email).toBe(account.email);

  // logout through the UI
  await page.getByRole('button', { name: account.email }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/auth\/login/);

  // the ended session fails at the API and at the protected URL
  expect((await page.context().request.get(`${API_URL}/auth/me`)).status()).toBe(401);
  await page.goto(protectedPath);
  await expect(page).toHaveURL(/\/auth\/login/);
  expect(new URL(page.url()).searchParams.get('redirect')).toContain(protectedPath);
});
