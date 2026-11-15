// @vitest-environment happy-dom
import { VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { queryClient } from '#/shared/api/client';
import { installFakeServer, server } from '#/test/fakeServer';
import { SelectStub } from '#/test/selectStub';

import RollPlanFields from './RollPlanFields.vue';

installFakeServer();
vi.mock('vue-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

const planPuts = () =>
  server.requests.filter((request) => request.method === 'put' && request.url === '/rolls/r1/plan');

function mountFields() {
  return mount(RollPlanFields, {
    props: { rollId: 'r1', plan: { target: 'scanned', developBy: 'lab', scanBy: 'self' } },
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
  });
}

describe('RollPlanFields', () => {
  it('sends the whole plan when one field changes', async () => {
    const wrapper = mountFields();
    await wrapper.get('select[aria-label="Develop by"]').setValue('self');
    await flushPromises();
    expect(planPuts().map((request) => request.body)).toEqual([
      { target: 'scanned', developBy: 'self', scanBy: 'self' },
    ]);
  });

  it('drops the scanner when the goal becomes develop only, which the API needs', async () => {
    const wrapper = mountFields();
    await wrapper.get('select[aria-label="Goal"]').setValue('developed');
    await flushPromises();
    expect(planPuts().map((request) => request.body)).toEqual([
      { target: 'developed', developBy: 'lab' },
    ]);
  });

  it('keeps the scanner when the goal is cleared, which the API allows', async () => {
    const wrapper = mountFields();
    await wrapper.get('select[aria-label="Goal"]').setValue('');
    await flushPromises();
    expect(planPuts().map((request) => request.body)).toEqual([
      { developBy: 'lab', scanBy: 'self' },
    ]);
  });
});
