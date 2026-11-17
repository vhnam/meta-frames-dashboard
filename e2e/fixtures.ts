import { randomUUID } from 'node:crypto';

import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

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

export interface ApiRoll {
  id: string;
  filmStockId: string;
  format: number;
  exposures: number;
  status: string;
  cameraId?: string;
}

/** Seed helpers: they use the page's cookie jar, so the signed-in account owns the data. */
export function seed(page: Page) {
  const client = page.context().request;
  return {
    async stock(brand: string, name: string) {
      const response = await client.post(`${API_URL}/film-stocks`, {
        data: { brand, name, type: 'color', boxIso: '400', process: 'C-41', packaging: 'factory' },
      });
      expect(response.status()).toBe(201);
      return (await response.json()).stock.id as string;
    },
    async camera(brand: string, model: string) {
      const response = await client.post(`${API_URL}/cameras`, {
        data: { brand, model, mount: 'F', hasFixedLens: false },
      });
      expect(response.status()).toBe(201);
      return (await response.json()).id as string;
    },
    async rolls(filmStockId: string, quantity: number) {
      const response = await client.post(`${API_URL}/rolls/bulk`, {
        data: { filmStockId, format: 135, exposures: 36, quantity },
        headers: { 'Idempotency-Key': randomUUID() },
      });
      expect(response.status()).toBe(201);
      return ((await response.json()) as ApiRoll[]).map((roll) => roll.id);
    },
    async lab(name: string) {
      const response = await client.post(`${API_URL}/labs`, { data: { name, scannerIds: [] } });
      expect(response.status()).toBe(201);
      return (await response.json()).id as string;
    },
    /** One order at the lab, with one single-roll line per product. Returns the order id and line ids. */
    async order(labId: string, code: string, products: string[]) {
      const id = randomUUID();
      const items = products.map((product) => ({
        id: randomUUID(),
        product,
        quantity: 1,
        unitPrice: 100000,
      }));
      const response = await client.put(`${API_URL}/lab-orders/${id}`, {
        data: { labId, code, orderedAt: new Date().toISOString(), items },
      });
      expect(response.status()).toBe(201);
      return { id, lineIds: items.map((item) => item.id) };
    },
    /** A develop-only job sent to the lab, on no order. A roll must be shot before it can go to a lab. */
    async job(rollId: string, labId: string) {
      const cameraId = await this.camera('E2E Cam', `job-${rollId.slice(0, 8)}`);
      expect(
        (await client.put(`${API_URL}/rolls/${rollId}/load`, { data: { cameraId } })).ok(),
      ).toBe(true);
      expect((await client.put(`${API_URL}/rolls/${rollId}/finish`, { data: {} })).ok()).toBe(true);
      const id = randomUUID();
      const response = await client.put(`${API_URL}/rolls/${rollId}/processing/${id}`, {
        data: { type: 'develop', labId },
      });
      expect(response.status()).toBe(201);
      return id;
    },
  };
}

export { API_URL, expect };
