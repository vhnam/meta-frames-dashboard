// @vitest-environment happy-dom
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/vue-router';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import { h } from 'vue';

import { router as dashboardRouter } from '#/app/router';
import { authKeys } from '#/features/auth';
import { queryClient } from '#/shared/api/client';
import { installFakeServer, server } from '#/test/fakeServer';

installFakeServer();
enableAutoUnmount(afterEach);

beforeEach(() => {
  server.reset();
  queryClient.clear();
  queryClient.setQueryData(authKeys.me(), {
    id: 'u1',
    email: 'ansel@example.com',
    name: 'Ansel',
    createdAt: '2026-10-07T09:00:00Z',
  });
});

function openRoute(href: string) {
  const router = createRouter({
    ...dashboardRouter.options,
    history: createMemoryHistory({ initialEntries: [href] }),
  });
  const view = mount(() => h(RouterProvider, { router }), {
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });
  return { router, view };
}

it.each([
  {
    resource: 'cameras',
    page: 'CameraDetailPage',
    param: 'cameraId',
    createRecord: () => server.addCamera(),
  },
  {
    resource: 'lenses',
    page: 'LensDetailPage',
    param: 'lensId',
    createRecord: () => server.addLens(),
  },
])('passes the $param from the URL to $page', async ({ resource, page, param, createRecord }) => {
  const record = createRecord();
  const { view } = openRoute(`/app/${resource}/${record.id}`);

  await vi.waitFor(() =>
    expect(view.getComponent({ name: page }).props()).toEqual({ [param]: record.id }),
  );
});

it('passes the new roll ID and requests that record on a same-route navigation', async () => {
  const first = server.addRoll({});
  const second = server.addRoll({});
  const { router, view } = openRoute(`/app/rolls/${first.id}`);
  const props = () => view.getComponent({ name: 'RollDetailPage' }).props();

  await vi.waitFor(() => expect(props()).toEqual({ rollId: first.id }));
  await router.navigate({ to: '/app/rolls/$rollId', params: { rollId: second.id } });

  await vi.waitFor(() => {
    expect(props()).toEqual({ rollId: second.id });
    expect(server.requests).toContainEqual(
      expect.objectContaining({ method: 'get', url: `/rolls/${second.id}` }),
    );
  });
});

it.each([
  {
    route: '/app/stocks',
    endpoint: '/film-stocks',
    page: 'StockDetailPage',
    param: 'stockId',
    createRecord: (name: string) => server.addStock({ name }),
  },
  {
    route: '/app/orders',
    endpoint: '/lab-orders',
    page: 'LabOrderDetailPage',
    param: 'orderId',
    createRecord: (code: string) =>
      server.saveLabOrder(code, {
        code,
        labId: server.addLab().id,
        orderedAt: '2026-10-07',
        items: [],
      }),
  },
])(
  'passes $param and requests the next record on a same-route navigation',
  async ({ route, endpoint, page, param, createRecord }) => {
    const first = createRecord('first');
    const second = createRecord('second');
    const { router, view } = openRoute(`${route}/${first.id}`);
    const props = () => view.getComponent({ name: page }).props();

    await vi.waitFor(() => expect(props()).toEqual({ [param]: first.id }));
    await router.navigate({ href: `${route}/${second.id}` });

    await vi.waitFor(() => {
      expect(props()).toEqual({ [param]: second.id });
      expect(server.requests).toContainEqual(
        expect.objectContaining({ method: 'get', url: `${endpoint}/${second.id}` }),
      );
    });
  },
);

it('updates roll list search props without passing pager keys to the page', async () => {
  const { router, view } = openRoute('/app/rolls?tab=in_stock&expiry=undated&pageSize=20');
  const props = () => view.getComponent({ name: 'RollListPage' }).props();

  await vi.waitFor(() =>
    expect(props()).toEqual({ search: { tab: 'in_stock', expiry: 'undated' } }),
  );
  await router.navigate({
    to: '/app/rolls',
    search: { tab: 'in_stock', expiry: 'expired', pageSize: 20 },
  });

  await vi.waitFor(() =>
    expect(props()).toEqual({ search: { tab: 'in_stock', expiry: 'expired' } }),
  );
  expect(router.state.location.search.pageSize).toBe(20);
});
