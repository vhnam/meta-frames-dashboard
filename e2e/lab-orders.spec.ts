import { API_URL, expect, seed, test } from './fixtures';

interface ApiOrder {
  items: { id: string; jobs: { id: string }[] }[];
}

test('L1: link an eligible job to a lab-order line, the relationship persists', async ({
  page,
  signedIn,
}) => {
  const api = page.context().request;
  const seeded = seed(page);
  const stockId = await seeded.stock('E2E Brand', 'L1 Stock');
  const labId = await seeded.lab('E2E Lab L1');
  const order = await seeded.order(labId, 'L1-001', ['L1 Develop', 'L1 Scan']);
  const [rollId] = await seeded.rolls(stockId, 1);
  const jobId = await seeded.job(rollId, labId);
  const [firstLineId, targetLineId] = order.lineIds;

  const read = async () =>
    (await (await api.get(`${API_URL}/lab-orders/${order.id}`)).json()) as ApiOrder;
  const jobsOn = (lab: ApiOrder, lineId: string) =>
    lab.items.find((item) => item.id === lineId)?.jobs.map((job) => job.id);
  expect((await read()).items.flatMap((item) => item.jobs)).toEqual([]);

  await page.goto(`/app/orders/${order.id}`);
  // the "Add" button of the second line opens the dialog with that line ticked
  await page
    .getByRole('row')
    .filter({ hasText: 'L1 Scan' })
    .getByRole('button', { name: 'Add' })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').click();
  await page.getByRole('option').click();
  await expect(dialog.getByRole('checkbox', { name: 'Bill this roll on L1 Scan' })).toBeChecked();

  const link = page.waitForResponse(
    (response) =>
      response.url() === `${API_URL}/processing/${jobId}/order-items` &&
      response.request().method() === 'PUT',
  );
  await dialog.getByRole('button', { name: 'Add roll' }).click();
  expect((await link).status()).toBe(200);

  // fresh reads, before and after a reload
  for (const reload of [false, true]) {
    if (reload) {
      await page.reload();
      await expect(page.locator(`a[href="/app/rolls/${rollId}"]`).first()).toBeVisible();
    }
    const saved = await read();
    expect(jobsOn(saved, targetLineId)).toEqual([jobId]);
    expect(jobsOn(saved, firstLineId)).toEqual([]);
  }
  void signedIn;
});
