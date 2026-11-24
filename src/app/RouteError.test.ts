// @vitest-environment happy-dom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  ErrorComponent,
  Outlet,
  redirect,
  RouterProvider,
  type ErrorComponentProps,
} from '@tanstack/vue-router';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { defineComponent, h } from 'vue';
import { toast } from 'vue-sonner';

import NotFoundPage from '#/layouts/root/NotFoundPage.vue';
import RootLayout from '#/layouts/root/RootLayout.vue';

import { installProviders } from './providers';
import RouteError from './RouteError.vue';
import { router as dashboardRouter } from './router';

enableAutoUnmount(afterEach);
afterEach(() => vi.restoreAllMocks());

function openRoute(
  path: string,
  failure?: { source: 'beforeLoad' | 'setup'; throwError: () => never },
) {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const report = vi.spyOn(toast, 'error').mockImplementation(() => 'unexpected-error');
  const rootRoute = createRootRoute({ component: RootLayout, notFoundComponent: NotFoundPage });
  const appRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/app',
    component: () => h('main', h(Outlet)),
  });
  const brokenRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/broken',
    beforeLoad: failure?.source === 'beforeLoad' ? failure.throwError : undefined,
    component: defineComponent({
      setup() {
        if (failure?.source === 'setup') failure.throwError();
        return () => null;
      },
      render: () => null,
    }),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: () => {
      throw redirect({ to: '/app' });
    },
  });
  const { defaultErrorComponent, defaultOnCatch } = dashboardRouter.options;
  const router = createRouter({
    defaultErrorComponent,
    defaultOnCatch,
    routeTree: rootRoute.addChildren([indexRoute, appRoute.addChildren([brokenRoute])]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const wrapper = mount(() => h(RouterProvider, { router }), {
    global: { plugins: [installProviders] },
  });

  return { router, wrapper, log, report };
}

it.each([
  { source: 'beforeLoad', component: 'MatchInner' },
  { source: 'setup', component: 'VueErrorBoundary' },
] as const)(
  'reports a $source error once per attempt and keeps the fallback on re-render',
  async ({ source, component }) => {
    const first = new Error('First route failure');
    const second = new Error('Second route failure');
    let failure = first;
    const { wrapper, log, report } = openRoute('/app/broken', {
      source,
      throwError: () => {
        throw failure;
      },
    });
    const toastOptions = expect.objectContaining({ id: 'unexpected-error' });

    await vi.waitFor(() => expect(wrapper.findComponent(ErrorComponent).exists()).toBe(true));
    const fallback = wrapper.getComponent(RouteError);
    const errorComponent = fallback.getComponent(ErrorComponent);
    const { error, info, reset } = fallback.props() as ErrorComponentProps;
    const fallbackElement = errorComponent.element;

    expect(errorComponent.element.closest('main')).toBe(wrapper.get('main').element);
    expect(errorComponent.props('error')).toBe(error);
    expect(error).toBe(first);
    if (source === 'beforeLoad') expect(info).toEqual({ componentStack: '' });
    expect(errorComponent.props('reset')).toBe(reset);
    expect(errorComponent.vm.$attrs.info).toBe(info);
    expect(log).toHaveBeenCalledExactlyOnceWith(first, 'router error boundary');
    expect(report).toHaveBeenCalledExactlyOnceWith(expect.any(String), toastOptions);

    const renderer = wrapper.findAllComponents({ name: component }).at(-1);
    expect(renderer).toBeDefined();
    renderer?.vm.$forceUpdate();
    await flushPromises();

    expect(wrapper.getComponent(ErrorComponent).element).toBe(fallbackElement);
    expect(log).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledTimes(1);

    failure = second;
    errorComponent.props('reset')?.();

    await vi.waitFor(() =>
      expect(wrapper.getComponent(ErrorComponent).props('error')).toBe(second),
    );
    expect.soft(log.mock.calls).toEqual([
      [first, 'router error boundary'],
      [second, 'router error boundary'],
    ]);
    expect.soft(report.mock.calls).toEqual([
      [expect.any(String), toastOptions],
      [expect.any(String), toastOptions],
    ]);
  },
);

it('follows a beforeLoad redirect without reporting an error', async () => {
  const { router, wrapper, log, report } = openRoute('/');

  await vi.waitFor(() => expect(wrapper.find('main').exists()).toBe(true));
  expect(router.state.location.pathname).toBe('/app');
  expect(wrapper.findComponent(ErrorComponent).exists()).toBe(false);
  expect(log).not.toHaveBeenCalled();
  expect(report).not.toHaveBeenCalled();
});

it('renders the not-found fallback without reporting an error', async () => {
  const { wrapper, log, report } = openRoute('/missing');

  await vi.waitFor(() => expect(wrapper.findComponent(NotFoundPage).exists()).toBe(true));
  expect(wrapper.findComponent(ErrorComponent).exists()).toBe(false);
  expect(log).not.toHaveBeenCalled();
  expect(report).not.toHaveBeenCalled();
});
