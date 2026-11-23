// @vitest-environment happy-dom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/vue-router';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { h, nextTick, ref } from 'vue';

import DetailHero from '../detail-hero/DetailHero.vue';
import PageHeader from './PageHeader.vue';

enableAutoUnmount(afterEach);

it('keeps the new page title after list and detail route swaps', async () => {
  const rootRoute = createRootRoute({ component: Outlet });
  const appRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/app',
    component: Outlet,
  });
  const listRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/rolls',
    component: () => h(PageHeader, { title: 'Rolls' }),
  });
  const detailRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/rolls/$rollId',
    component: () => h(DetailHero, { kind: 'Roll', id: 'roll-1', title: 'Portra 400' }),
  });
  const otherListRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/cameras',
    component: () => h(PageHeader, { title: 'Cameras' }),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      appRoute.addChildren([listRoute, detailRoute, otherListRoute]),
    ]),
    history: createMemoryHistory({ initialEntries: ['/app/rolls'] }),
  });

  mount(() => h(RouterProvider, { router }));
  await vi.waitFor(() => expect(document.title).toBe('Rolls | Meta Frames'));

  await router.navigate({ to: '/app/rolls/$rollId', params: { rollId: 'roll-1' } });
  expect(document.title).toBe('Portra 400 | Meta Frames');

  await router.navigate({ to: '/app/rolls' });
  expect(document.title).toBe('Rolls | Meta Frames');

  await router.navigate({ to: '/app/cameras' });
  expect(document.title).toBe('Cameras | Meta Frames');
});

it('updates the list title and restores the dashboard title on unmount', async () => {
  const title = ref('Rolls');
  const wrapper = mount(() => h(PageHeader, { title: title.value }));
  expect(document.title).toBe('Rolls | Meta Frames');

  title.value = 'Cameras';
  await nextTick();
  expect(document.title).toBe('Cameras | Meta Frames');

  wrapper.unmount();
  expect(document.title).toBe('Meta Frames | Dashboard');
});
