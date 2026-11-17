import { randomUUID } from 'node:crypto';

import { test as base, expect } from '@playwright/test';

const API_URL = 'http://127.0.0.1:18080';
const PASSWORD = 'E2e-Passw0rd!';

export interface Account {
  email: string;
  password: string;
}

interface Fixtures {
  /** A new account. The browser context stays anonymous. */
  account: Account;
  /** The same account, signed in: the page and its request client share one cookie jar. */
  signedIn: Account;
}

export const test = base.extend<Fixtures>({
  account: async ({ request }, use, testInfo) => {
    const email = `e2e-${testInfo.testId}-${testInfo.retry}-${randomUUID().slice(0, 8)}@example.test`;
    // the standalone `request` has its own cookie jar, so the register cookie does not reach the page
    const response = await request.post(`${API_URL}/auth/register`, {
      data: { email, password: PASSWORD },
    });
    expect(response.ok()).toBe(true);
    await use({ email, password: PASSWORD });
  },
  signedIn: async ({ account, page }, use) => {
    const response = await page.context().request.post(`${API_URL}/auth/login`, {
      data: { email: account.email, password: account.password },
    });
    expect(response.ok()).toBe(true);
    await use(account);
  },
});

export { API_URL, expect };
