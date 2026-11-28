// Runs in project `email-verification`: dashboard on 4174, server on 18081 with
// EMAIL_VERIFICATION=enforce, mail caught by Mailpit (see e2e/stack.ts).
import { randomUUID } from 'node:crypto';

import type { APIRequestContext, Page } from '@playwright/test';

import { expect, test } from './fixtures';

const ENFORCE_API_URL = 'http://127.0.0.1:18081';
const MAILPIT_URL = 'http://127.0.0.1:18025';
const PASSWORD = 'E2e-Passw0rd!';
const LINK_PATTERN = /http:\/\/127\.0\.0\.1:18081\/auth\/verify-email#token=[^\s"<>]+/;

function newEmail() {
  return `e2e-verify-${randomUUID()}@example.test`;
}

async function mailsTo(request: APIRequestContext, email: string) {
  const search = await request.get(
    `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
  );
  expect(search.ok()).toBe(true);
  return (await search.json()).messages as { ID: string }[];
}

/** Waits for the one mail to `email` and returns the verification link in it. */
async function verificationLink(request: APIRequestContext, email: string) {
  let messages: { ID: string }[] = [];
  await expect.poll(async () => (messages = await mailsTo(request, email)).length).toBe(1);
  const message = await request.get(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
  expect(message.status()).toBe(200);
  const match = ((await message.json()).Text as string).match(LINK_PATTERN);
  expect(match).not.toBeNull();
  return match![0];
}

async function registerByApi(request: APIRequestContext, email: string) {
  const response = await request.post(`${ENFORCE_API_URL}/auth/register`, {
    data: { email, password: PASSWORD },
  });
  expect(response.status()).toBe(201);
}

async function logInByUi(page: Page, email: string) {
  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
}

/** Opens the link page, enters the password, submits, and returns the verify-email response. */
async function submitLink(page: Page, link: string) {
  await page.goto('about:blank'); // a fragment-only change would not reload the page
  await page.goto(link);
  await page.getByLabel(/^Password/).fill(PASSWORD);
  const verify = page.waitForResponse(
    (response) =>
      response.url() === `${ENFORCE_API_URL}/auth/verify-email` &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Verify email' }).click();
  return verify;
}

test('V1: registering when verification is required starts no session and mails one link', async ({
  page,
}) => {
  const email = newEmail();
  await page.goto('/auth/register?redirect=%2Fapp%2Frolls');
  await page.getByRole('textbox', { name: 'Full name' }).fill('E2E Shooter');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm password').fill(PASSWORD);
  const registered = page.waitForResponse(
    (response) =>
      response.url() === `${ENFORCE_API_URL}/auth/register` &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Create account' }).click();

  const response = await registered;
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.verificationRequired).toBe(true);

  await expect(page.getByText(body.message).first()).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
  expect(new URL(page.url()).searchParams.get('redirect')).toBe('/app/rolls');
  expect((await page.context().request.get(`${ENFORCE_API_URL}/auth/me`)).status()).toBe(401);

  expect(await verificationLink(page.request, email)).toMatch(LINK_PATTERN);
  expect(await mailsTo(page.request, email)).toHaveLength(1);
});

test('V2: logging in before verifying is refused and starts no session', async ({ page }) => {
  const email = newEmail();
  await registerByApi(page.request, email);

  const login = page.waitForResponse(
    (response) =>
      response.url() === `${ENFORCE_API_URL}/auth/login` && response.request().method() === 'POST',
  );
  await logInByUi(page, email);

  const response = await login;
  expect(response.status()).toBe(403);
  const body = await response.json();
  expect(body.code).toBe('email_verification_required');

  await expect(page.getByRole('alert').getByText(body.message)).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
  expect((await page.context().request.get(`${ENFORCE_API_URL}/auth/me`)).status()).toBe(401);
});

test('V3: the mailed link verifies the account, then login works', async ({ page }) => {
  const email = newEmail();
  await registerByApi(page.request, email);

  const verified = await submitLink(page, await verificationLink(page.request, email));
  expect(verified.status()).toBe(200);

  await logInByUi(page, email);
  await expect(page).toHaveURL((url) => url.pathname === '/app');
  const me = await page.context().request.get(`${ENFORCE_API_URL}/auth/me`);
  expect(me.status()).toBe(200);
  expect((await me.json()).email).toBe(email);
});

test('V4: a used link does not work twice, and login still works', async ({ page }) => {
  const email = newEmail();
  await registerByApi(page.request, email);
  const link = await verificationLink(page.request, email);

  expect((await submitLink(page, link)).status()).toBe(200);

  const again = await submitLink(page, link);
  expect(again.status()).toBe(422);
  expect((await again.json()).code).toBe('invalid_token');

  await logInByUi(page, email);
  await expect(page).toHaveURL((url) => url.pathname === '/app');
  expect((await page.context().request.get(`${ENFORCE_API_URL}/auth/me`)).status()).toBe(200);
});
