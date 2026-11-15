import { VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { queryClient } from '#/shared/api/client';
import { installFakeServer, server } from '#/test/fakeServer';
import { SelectStub } from '#/test/selectStub';

// @vitest-environment happy-dom
import { rollQueries } from '../../api';
import type { RollListRow } from '../../types';
import HandOverDialog from './HandOverDialog.vue';

installFakeServer();
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

const NORITSU = 'd177cb3c-a850-4232-a4ca-75189b7b279b';
const today = () => new Date().toLocaleDateString('en-CA');
const submit = () =>
  (document.body.querySelector('button[type=submit]') as HTMLButtonElement).click();
const handoffPosts = () =>
  server.requests.filter((request) => request.method === 'post' && request.url === '/lab-handoffs');
const handoffPost = () => handoffPosts()[0];

/** Two finished rolls; the first plans develop only. */
async function mountDialog(developOnlyBoth = false) {
  const stock = server.addStock({ name: 'Portra', brand: 'Kodak' });
  const lab = server.addLab({ name: 'Saigon Film Lab' });
  const first = server.addRoll({ filmStockId: stock.id, status: 'done_shooting' });
  const second = server.addRoll({ filmStockId: stock.id, status: 'done_shooting' });
  const list = await queryClient.fetchQuery(rollQueries.list({}));
  const developOnly = (row: RollListRow): RollListRow => ({
    ...row,
    plan: { ...row.plan, target: 'developed' },
  });
  const rows = [first, second].map((rec, index) => {
    const row = list.find((candidate) => candidate.roll.id === rec.id)!;
    return index === 0 || developOnlyBoth ? developOnly(row) : row;
  });
  const wrapper = mount(HandOverDialog, {
    attachTo: document.body,
    props: { open: false, rows },
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
  });
  await wrapper.setProps({ open: true } as never);
  await vi.waitFor(() =>
    expect(document.body.querySelector(`option[value="${lab.id}"]`)).not.toBeNull(),
  );
  const labSelect = document.body.querySelector('select') as HTMLSelectElement;
  labSelect.value = lab.id;
  labSelect.dispatchEvent(new Event('change'));
  await flushPromises();
  return { wrapper, lab, first, second };
}

describe('HandOverDialog', () => {
  it('hands every roll over in one request, each on the job its plan asks for', async () => {
    const { wrapper, lab, first, second } = await mountDialog();
    submit();
    await vi.waitFor(() => expect(handoffPost()).toBeDefined());
    expect(handoffPost()!.body).toEqual({
      labId: lab.id,
      handedAt: today(),
      scanOrders: [{ scannerId: NORITSU, settings: { resolution: 'standard' } }],
      rolls: [
        { rollId: first.id, type: 'develop' },
        { rollId: second.id, type: 'develop_scan' },
      ],
    });
    // a retry of the same request must not hand the rolls over twice
    expect(handoffPost()!.headers['Idempotency-Key']).toBeTruthy();
    wrapper.unmount();
  });

  it('resends the same batch with the same key, and a changed batch with a new one', async () => {
    server.handOverFailures = 2;
    const { wrapper, second } = await mountDialog();
    submit();
    await vi.waitFor(() => expect(handoffPosts()).toHaveLength(1));
    await flushPromises();
    // the reply was lost: the same batch again must not count as a new handover
    submit();
    await vi.waitFor(() => expect(handoffPosts()).toHaveLength(2));
    await flushPromises();
    const [first, again] = handoffPosts();
    expect(again!.headers['Idempotency-Key']).toBe(first!.headers['Idempotency-Key']);
    // a changed batch is a new request
    const services = document.body.querySelectorAll<HTMLSelectElement>(
      'select[aria-label^="Service for"]',
    );
    const secondService = services[1]!;
    secondService.value = 'develop';
    secondService.dispatchEvent(new Event('change'));
    await flushPromises();
    submit();
    await vi.waitFor(() => expect(handoffPosts()).toHaveLength(3));
    const changed = handoffPosts()[2]!;
    expect(changed.body).toMatchObject({ rolls: [{}, { rollId: second.id, type: 'develop' }] });
    expect(changed.headers['Idempotency-Key']).not.toBe(first!.headers['Idempotency-Key']);
    wrapper.unmount();
  });

  it('sends no scanners when no roll is scanned', async () => {
    const { wrapper } = await mountDialog(true);
    expect(document.body.querySelector('fieldset')).toBeNull();
    submit();
    await vi.waitFor(() => expect(handoffPost()).toBeDefined());
    expect(handoffPost()!.body).toMatchObject({ scanOrders: [] });
    wrapper.unmount();
  });
});
