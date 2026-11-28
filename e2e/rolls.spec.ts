import { API_URL, expect, expectNoSeriousA11yViolations, seed, test } from './fixtures';
import type { ApiRoll } from './fixtures';

test('R1: add two rolls for a stock, they persist as distinct in-stock rolls', async ({
  page,
  signedIn,
}) => {
  const api = page.context().request;
  const stockId = await seed(page).stock('E2E Brand', 'R1 Stock');
  const listUrl = `${API_URL}/rolls?filmStockId=${stockId}`;
  expect(await (await api.get(listUrl)).json()).toEqual([]);

  await page.goto('/app/rolls');
  await expect(page.getByRole('button', { name: 'Add rolls' })).toBeVisible();
  await expect(page.getByRole('tablist')).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await page.getByRole('button', { name: 'Add rolls' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Select film stock' }).click();
  await page.getByRole('option', { name: 'E2E Brand R1 Stock' }).click();
  await dialog.getByRole('combobox').filter({ hasText: '135' }).click();
  await page.getByRole('option', { name: '120' }).click();
  await dialog.getByRole('spinbutton', { name: 'e.g. 36' }).fill('24');
  await dialog.getByRole('spinbutton', { name: 'e.g. 1', exact: true }).fill('2');

  const bulk = page.waitForResponse(
    (response) =>
      response.url() === `${API_URL}/rolls/bulk` && response.request().method() === 'POST',
  );
  await dialog.getByRole('button', { name: 'Add 2 rolls' }).click();
  expect((await bulk).status()).toBe(201);

  // fresh reads, before and after a reload
  for (const reload of [false, true]) {
    if (reload) await page.reload();
    const rolls = (await (await api.get(listUrl)).json()) as ApiRoll[];
    // after the reload the inventory links to each saved roll record
    if (reload) {
      for (const roll of rolls)
        await expect(page.locator(`a[href="/app/rolls/${roll.id}"]`).first()).toBeVisible();
    }
    expect(new Set(rolls.map((roll) => roll.id)).size).toBe(2);
    for (const roll of rolls) {
      expect(roll).toMatchObject({
        filmStockId: stockId,
        format: 120,
        exposures: 24,
        status: 'in_stock',
      });
    }
  }
  void signedIn;
});

test('R2: load an in-stock roll into a camera, the assignment persists', async ({
  page,
  signedIn,
}) => {
  const api = page.context().request;
  const seeded = seed(page);
  const stockId = await seeded.stock('E2E Brand', 'R2 Stock');
  const cameraId = await seeded.camera('E2E Cam', 'R2');
  const [rollId] = await seeded.rolls(stockId, 1);

  await page.goto(`/app/rolls/${rollId}`);
  await expect(page.getByRole('button', { name: 'Load into camera' })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await page.getByRole('button', { name: 'Load into camera' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').filter({ hasText: 'Select a camera' }).click();
  await page.getByRole('option', { name: 'E2E Cam R2' }).click();

  const load = page.waitForResponse(
    (response) =>
      response.url() === `${API_URL}/rolls/${rollId}/load` && response.request().method() === 'PUT',
  );
  await dialog.getByRole('button', { name: 'Load roll' }).click();
  expect((await load).ok()).toBe(true);

  const read = async () => (await (await api.get(`${API_URL}/rolls/${rollId}`)).json()).roll;
  expect(await read()).toMatchObject({ status: 'in_camera', cameraId });

  // after a reload the detail page links to the saved camera
  await page.reload();
  await expect(page.getByRole('link', { name: 'E2E Cam R2' })).toHaveAttribute(
    'href',
    `/app/cameras/${cameraId}`,
  );
  expect(await read()).toMatchObject({ status: 'in_camera', cameraId });
  void signedIn;
});

test('R3: a stale roll edit is refused, the first edit persists, the second context recovers', async ({
  page,
  browser,
  signedIn,
}) => {
  const api = page.context().request;
  const seeded = seed(page);
  const stockId = await seeded.stock('E2E Brand', 'R3 Stock');
  const [rollId] = await seeded.rolls(stockId, 1);
  const rollUrl = `${API_URL}/rolls/${rollId}`;
  const read = async () =>
    (await (await api.get(rollUrl)).json()).roll as ApiRoll & { price?: number };

  // second context: same account, own cookie jar
  const other = await browser.newContext();
  try {
    const login = await other.request.post(`${API_URL}/auth/login`, {
      data: { email: signedIn.email, password: signedIn.password },
    });
    expect(login.ok()).toBe(true);
    const otherPage = await other.newPage();

    const openEdit = async (target: typeof page) => {
      await target.goto(`/app/rolls/${rollId}`);
      await target.getByRole('button', { name: 'Edit roll' }).click();
      const dialog = target.getByRole('dialog');
      await expect(dialog.getByRole('spinbutton', { name: 'e.g. 36' })).toHaveValue('36');
      return dialog;
    };
    const waitPut = (target: typeof page) =>
      target.waitForResponse(
        (response) => response.url() === rollUrl && response.request().method() === 'PUT',
      );

    // both contexts read the same version before either saves
    const first = await openEdit(page);
    const second = await openEdit(otherPage);

    await first.getByRole('spinbutton', { name: 'e.g. 36' }).fill('24');
    const firstPut = waitPut(page);
    await first.getByRole('button', { name: 'Save changes' }).click();
    expect((await firstPut).ok()).toBe(true);
    expect(await read()).toMatchObject({ exposures: 24 });

    await second.getByRole('spinbutton', { name: 'e.g. 36' }).fill('12');
    const stalePut = waitPut(otherPage);
    await second.getByRole('button', { name: 'Save changes' }).click();
    expect((await stalePut).status()).toBe(412);
    // the refused write left the first edit in place
    expect(await read()).toMatchObject({ exposures: 24 });

    // recover: take the current version, then a new edit goes through
    await second.getByRole('button', { name: 'Use the current values' }).click();
    await expect(second.getByRole('spinbutton', { name: 'e.g. 36' })).toHaveValue('24');
    await second.getByRole('spinbutton', { name: 'e.g. 150000' }).fill('5000');
    const recoveredPut = waitPut(otherPage);
    await second.getByRole('button', { name: 'Save changes' }).click();
    expect((await recoveredPut).ok()).toBe(true);
    expect(await read()).toMatchObject({ exposures: 24, price: 5000 });
  } finally {
    await other.close();
  }
});
