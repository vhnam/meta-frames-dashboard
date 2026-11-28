import { randomUUID } from 'node:crypto';

import type { Page } from '@playwright/test';

import { API_URL, expect, expectNoSeriousA11yViolations, test } from './fixtures';

test('A1: login restores the protected path, the session survives reload, logout ends it', async ({
  page,
  account,
}) => {
  const protectedPath = '/app/rolls?tab=in_stock';
  await page.goto('/auth/register');
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expectNoSeriousA11yViolations(page);

  await page.goto(protectedPath);

  // anonymous visit lands on login and keeps the original location
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  expect(new URL(page.url()).searchParams.get('redirect')).toContain(protectedPath);

  await page.getByRole('textbox', { name: 'Email' }).fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(
    (url) => url.pathname === '/app/rolls' && url.searchParams.get('tab') === 'in_stock',
  );
  await expect(page.getByRole('button', { name: account.email })).toBeVisible();
  await expect(page.getByRole('tablist')).toBeVisible();
  await expectNoSeriousA11yViolations(page);

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

test('A2: a session ended on the server sends the open page to login, and login restores access', async ({
  page,
  signedIn,
}) => {
  const protectedPath = '/app/rolls?tab=in_stock';
  // the page has loaded its data once the rolls list answers: no request is in flight at logout
  const firstList = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/rolls' && response.status() === 200,
  );
  await page.goto(protectedPath);
  await firstList;

  // end the session through the API, with the page's own cookie jar; the page stays open
  const logout = await page.context().request.post(`${API_URL}/auth/logout`);
  expect(logout.ok()).toBe(true);

  // a fresh feature request from the open page: client-side navigation to the cameras list
  const featureResponse = page.waitForResponse((response) => {
    const { pathname } = new URL(response.url());
    return response.url().startsWith(API_URL) && !pathname.startsWith('/auth/');
  });
  await page.getByRole('link', { name: 'Cameras', exact: true }).click();
  expect((await featureResponse).status()).toBe(401);

  await expect(page).toHaveURL(/\/auth\/login/);
  expect(new URL(page.url()).searchParams.get('redirect')).toContain('/app/cameras');

  await page.getByRole('textbox', { name: 'Email' }).fill(signedIn.email);
  await page.getByLabel('Password', { exact: true }).fill(signedIn.password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL((url) => url.pathname === '/app/cameras');
  expect((await page.context().request.get(`${API_URL}/auth/me`)).status()).toBe(200);
});

async function fillLogin(page: Page, email: string, password: string) {
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
}

test('A3: wrong credentials show an error, keep the page, and a later correct login works', async ({
  page,
  account,
}) => {
  await page.goto('/auth/login');
  await fillLogin(page, account.email, 'Wrong-Passw0rd!');

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
  expect((await page.context().request.get(`${API_URL}/auth/me`)).status()).toBe(401);

  await fillLogin(page, account.email, account.password);
  await expect(page).toHaveURL((url) => url.pathname === '/app');
});

test('A4: an unsafe redirect parameter is ignored after login', async ({ page, account }) => {
  for (const unsafe of ['https://evil.example/app', '//evil.example/app']) {
    await page.goto(`/auth/login?redirect=${encodeURIComponent(unsafe)}`);
    await fillLogin(page, account.email, account.password);
    await expect(page).toHaveURL(
      (url) => url.origin === 'http://127.0.0.1:4173' && url.pathname === '/app',
    );
    await page.context().request.post(`${API_URL}/auth/logout`);
  }
});

test('A5: a locked account shows an error and stays signed out, even with the right password', async ({
  page,
  account,
}) => {
  // five failed attempts lock the account
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.context().request.post(`${API_URL}/auth/login`, {
      data: { email: account.email, password: 'Wrong-Passw0rd!' },
    });
  }
  await page.goto('/auth/login');
  await fillLogin(page, account.email, account.password);

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
  expect((await page.context().request.get(`${API_URL}/auth/me`)).status()).toBe(401);
});

async function fillRegister(page: Page, email: string, password: string, confirm = password) {
  await page.getByRole('textbox', { name: 'Full name' }).fill('E2E Shooter');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(confirm);
  await page.getByRole('button', { name: 'Create account' }).click();
}

test('A6: register shows the password rules, blocks a weak password, then signs the new account in', async ({
  page,
}) => {
  const email = `e2e-register-${randomUUID().slice(0, 8)}@example.test`;
  await page.goto('/auth/register');
  await expect(page.getByText(/At least 8 characters with upper and lower case/)).toBeVisible();

  let registerCalls = 0;
  page.on('request', (request) => {
    if (request.url() === `${API_URL}/auth/register`) registerCalls++;
  });
  await fillRegister(page, email, 'weak');
  await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
  expect(registerCalls).toBe(0);

  await fillRegister(page, email, 'E2e-Passw0rd!');
  await expect(page).toHaveURL((url) => url.pathname === '/app');
  const me = await page.context().request.get(`${API_URL}/auth/me`);
  expect(me.status()).toBe(200);
  expect((await me.json()).email).toBe(email);
});

test('A7: registering a taken email shows an error, stays on the page and creates no session', async ({
  page,
  account,
}) => {
  await page.goto('/auth/register');
  await fillRegister(page, account.email, 'Other-Passw0rd!');

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/register/);
  expect((await page.context().request.get(`${API_URL}/auth/me`)).status()).toBe(401);
});

test('A8: a failed Google sign-in lands on login with a readable message, and the Google button is offered', async ({
  page,
}) => {
  // the API redirects the browser to {APP_URL}/login?error=<code>: the legacy route forwards it
  await page.goto('/login?error=account_locked');
  await expect(page).toHaveURL(/\/auth\/login\?error=account_locked/);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
    'href',
    /\/auth\/oauth2\/google\?redir=/,
  );
  expect((await page.context().request.get(`${API_URL}/auth/me`)).status()).toBe(401);
});
