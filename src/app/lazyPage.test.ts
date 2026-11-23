// @vitest-environment happy-dom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  ErrorComponent,
  Link,
  Outlet,
  RouterProvider,
  useParams,
  useSearch,
} from '@tanstack/vue-router';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import { defineComponent, h, type Component } from 'vue';
import { toast } from 'vue-sonner';

import { lazyPage } from './lazyPage';
import { installProviders } from './providers';
import RouteError from './RouteError.vue';
import RoutePending from './RoutePending.vue';
import { router as dashboardRouter } from './router';

const staleError = new Error('Failed to fetch dynamically imported module: /page-old.js');
const reloadKey = (error: Error) => `tanstack_router_reload:${error.message}`;
const toastOptions = expect.objectContaining({ id: 'unexpected-error' });
const TestPage = defineComponent({
  props: { recordId: String, filter: String },
  render: () => h('article'),
});

enableAutoUnmount(afterEach);
beforeEach(() => sessionStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function observeErrors() {
  return {
    log: vi.spyOn(console, 'error').mockImplementation(() => {}),
    report: vi.spyOn(toast, 'error').mockImplementation(() => 'unexpected-error'),
    reload: vi.spyOn(window.location, 'reload').mockImplementation(() => {}),
  };
}

function deferredImport() {
  let resolve!: (module: { default: Component }) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<{ default: Component }>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function readPageProps() {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  return () => {
    const paramValues: Record<string, unknown> = params.value;
    const searchValues: Record<string, unknown> = search.value;
    return { recordId: paramValues.recordId, filter: searchValues.filter };
  };
}

function mountRouter(importer: () => Promise<{ default: Component }>, mapProps = false) {
  const root = createRootRoute({ component: () => h('main', h(Outlet)) });
  const target = createRoute({
    getParentRoute: () => root,
    path: '/items/$recordId',
    validateSearch: (search: Record<string, unknown>) => ({
      filter: typeof search.filter === 'string' ? search.filter : '',
    }),
    component: lazyPage(importer, mapProps ? readPageProps : undefined),
  });
  const home = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => h(Link, { to: '/items/first' }, { default: () => 'Open record' }),
  });
  const { defaultErrorComponent, defaultOnCatch, defaultPendingComponent, defaultPreload } =
    dashboardRouter.options;
  const router = createRouter({
    defaultErrorComponent,
    defaultOnCatch,
    defaultPendingComponent,
    defaultPreload,
    routeTree: root.addChildren([home, target]),
    history: createMemoryHistory(),
  });
  const wrapper = mount(() => h(RouterProvider, { router }), {
    global: { plugins: [installProviders] },
  });
  const navigate = (recordId = 'first', filter = '') =>
    router.navigate({
      href: `/items/${encodeURIComponent(recordId)}?${new URLSearchParams({ filter })}`,
    });

  return { router, wrapper, navigate };
}

it.each([false, true])('shares concurrent preload work with mapProps=%s', async (mapProps) => {
  const loaded = deferredImport();
  const importer = vi.fn(() => loaded.promise);
  const page = lazyPage(importer, mapProps ? () => () => ({ recordId: 'first' }) : undefined);

  const readPreload = () => ('preload' in page ? page.preload : undefined);
  const preload = readPreload();
  expect(preload).toBeTypeOf('function');
  if (typeof preload !== 'function') throw new Error('Missing route preload');

  const first = preload();
  const second = preload();
  expect(importer).toHaveBeenCalledTimes(1);
  loaded.resolve({ default: TestPage });
  await Promise.all([first, second]);

  expect(readPreload()).toBeUndefined();
});

it('updates props from params and search on the same route', async () => {
  const importer = vi.fn(async () => ({ default: TestPage }));
  const { wrapper, navigate } = mountRouter(importer, true);

  await navigate('first', 'open');
  expect(wrapper.getComponent(TestPage).props()).toEqual({ recordId: 'first', filter: 'open' });
  await navigate('second', 'open');
  expect(wrapper.getComponent(TestPage).props()).toEqual({ recordId: 'second', filter: 'open' });
  await navigate('second', 'closed');
  expect(wrapper.getComponent(TestPage).props()).toEqual({ recordId: 'second', filter: 'closed' });
  expect(importer).toHaveBeenCalledTimes(1);
});

it('cleans up route subscriptions created by the props adapter when leaving', async () => {
  const { router, wrapper, navigate } = mountRouter(async () => ({ default: TestPage }), true);
  const store = router.stores.getMatchStore('/items/$recordId');
  // The Vue router supplies an atom. The router core only types its get method.
  const atom = store as typeof store & {
    subscribe(listener: (match: ReturnType<typeof store.get>) => void): { unsubscribe(): void };
  };
  const subscribe = atom.subscribe.bind(atom);
  const disposals: Array<ReturnType<typeof vi.fn>> = [];
  vi.spyOn(atom, 'subscribe').mockImplementation((listener) => {
    const subscription = subscribe(listener);
    const unsubscribe = vi.fn(() => subscription.unsubscribe());
    disposals.push(unsubscribe);
    return { unsubscribe };
  });

  await navigate('first', 'open');
  await navigate('second', 'closed');
  expect(wrapper.getComponent(TestPage).props()).toEqual({ recordId: 'second', filter: 'closed' });
  expect(disposals.length).toBeGreaterThan(0);
  await router.navigate({ to: '/' });
  expect(wrapper.findComponent(TestPage).exists()).toBe(false);
  expect(disposals.filter((unsubscribe) => unsubscribe.mock.calls.length === 0)).toHaveLength(0);
});

it('reports a failed active import through the match error state and reports again on a new visit', async () => {
  const first = new Error('First import failed');
  const second = new Error('Second import failed');
  const importer = vi.fn().mockRejectedValueOnce(first).mockRejectedValueOnce(second);
  const { log, report, reload } = observeErrors();
  const { router, wrapper, navigate } = mountRouter(importer);
  await vi.waitFor(() => expect(wrapper.find('a').exists()).toBe(true));

  await navigate();
  const fallback = wrapper.getComponent(RouteError);
  expect(fallback.element.closest('main')).toBe(wrapper.get('main').element);
  expect(router.state.matches.at(-1)?.status).toBe('error');
  expect(fallback.getComponent(ErrorComponent).props('error')).toBe(first);
  expect(importer).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalledExactlyOnceWith(first, 'router error boundary');
  expect(report).toHaveBeenCalledExactlyOnceWith(expect.any(String), toastOptions);

  await router.navigate({ to: '/' });
  expect(wrapper.findComponent(RouteError).exists()).toBe(false);
  await navigate();
  expect(wrapper.getComponent(RouteError).getComponent(ErrorComponent).props('error')).toBe(second);
  expect(importer).toHaveBeenCalledTimes(2);
  expect(log.mock.calls).toEqual([
    [first, 'router error boundary'],
    [second, 'router error boundary'],
  ]);
  expect(report.mock.calls).toEqual([
    [expect.any(String), toastOptions],
    [expect.any(String), toastOptions],
  ]);
  expect(reload).not.toHaveBeenCalled();
});

it.each(['key set', 'missing', 'read throws', 'write throws'] as const)(
  'shows and reports a stale import fallback when reload storage is %s',
  async (storage) => {
    if (storage === 'key set') {
      sessionStorage.setItem(reloadKey(staleError), '1');
    } else if (storage === 'missing') {
      vi.stubGlobal('sessionStorage', undefined);
    } else {
      const storageError = () => {
        throw new Error('Storage blocked');
      };
      vi.stubGlobal('sessionStorage', {
        getItem: storage === 'read throws' ? storageError : () => null,
        setItem: storageError,
      });
    }
    const importer = vi.fn().mockRejectedValue(staleError);
    const { log, report, reload } = observeErrors();
    const { wrapper, navigate } = mountRouter(importer);
    await vi.waitFor(() => expect(wrapper.find('a').exists()).toBe(true));

    await navigate();
    const fallback = wrapper.getComponent(RouteError);
    const error: unknown = fallback.getComponent(ErrorComponent).props('error');
    if (storage !== 'write throws') expect(error).toHaveProperty('cause', staleError);
    expect(importer).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledExactlyOnceWith(error, 'router error boundary');
    expect(report).toHaveBeenCalledExactlyOnceWith(expect.any(String), toastOptions);
    expect(reload).not.toHaveBeenCalled();
  },
);

it('shows and reports one stale import fallback without reloading while offline', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const importer = vi.fn().mockRejectedValue(staleError);
  const { log, report, reload } = observeErrors();
  const { wrapper, navigate } = mountRouter(importer);
  await vi.waitFor(() => expect(wrapper.find('a').exists()).toBe(true));

  await navigate();

  expect(reload).not.toHaveBeenCalled();
  expect(wrapper.findAllComponents(RouteError)).toHaveLength(1);
  const error: unknown = wrapper
    .getComponent(RouteError)
    .getComponent(ErrorComponent)
    .props('error');
  expect(error).toHaveProperty('cause', staleError);
  expect(importer).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalledExactlyOnceWith(error, 'router error boundary');
  expect(report).toHaveBeenCalledExactlyOnceWith(expect.any(String), toastOptions);
});

it('uses the router reload on the first stale import without reporting before reload', async () => {
  const importer = vi.fn().mockRejectedValue(staleError);
  const { log, report, reload } = observeErrors();
  const { wrapper, navigate } = mountRouter(importer);
  await vi.waitFor(() => expect(wrapper.find('a').exists()).toBe(true));

  await navigate();
  expect(importer).toHaveBeenCalledTimes(1);
  expect(reload).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem(reloadKey(staleError))).toBe('1');
  expect(wrapper.findComponent(RouteError).exists()).toBe(false);
  expect(log).not.toHaveBeenCalled();
  expect(report).not.toHaveBeenCalled();
});

it('caps automatic reloads when the stale asset URL changes across documents', async () => {
  const { reload, log, report } = observeErrors();
  const first = mountRouter(vi.fn().mockRejectedValue(staleError));
  await vi.waitFor(() => expect(first.wrapper.find('a').exists()).toBe(true));
  await first.navigate();
  expect(reload).toHaveBeenCalledTimes(1);
  first.wrapper.unmount();

  const changed = new Error('Failed to fetch dynamically imported module: /page-new.js');
  const next = mountRouter(vi.fn().mockRejectedValue(changed));
  await vi.waitFor(() => expect(next.wrapper.find('a').exists()).toBe(true));
  await next.navigate();

  expect.soft(reload).toHaveBeenCalledTimes(1);
  expect.soft(next.wrapper.findComponent(RouteError).exists()).toBe(true);
  expect.soft(log).toHaveBeenCalledTimes(1);
  expect.soft(report).toHaveBeenCalledExactlyOnceWith(expect.any(String), toastOptions);
});

it.each([
  { event: 'mouseenter', error: staleError },
  { event: 'focus', error: new Error('Speculative import failed') },
])(
  'preloads on $event only and leaves the current page in place on failure',
  async ({ event, error }) => {
    const loaded = deferredImport();
    const importer = vi.fn(() => loaded.promise);
    const { log, report, reload } = observeErrors();
    const { router, wrapper } = mountRouter(importer, true);
    const preloadRoute = vi.spyOn(router, 'preloadRoute');
    await vi.waitFor(() => expect(wrapper.find('a').exists()).toBe(true));
    await flushPromises();
    const link = wrapper.get('a');
    expect(importer).not.toHaveBeenCalled();

    await link.trigger(event);
    await vi.waitFor(() => expect(importer).toHaveBeenCalledTimes(1));
    loaded.reject(error);
    await preloadRoute.mock.results[0]?.value;
    await flushPromises();

    expect(router.state.location.pathname).toBe('/');
    expect(wrapper.get('a').element).toBe(link.element);
    expect(wrapper.findComponent(RouteError).exists()).toBe(false);
    expect(wrapper.findComponent(TestPage).exists()).toBe(false);
    expect(log).not.toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(reloadKey(error))).toBeNull();
  },
);

it('keeps the default pending delay and skips pending UI on a fast import', async () => {
  const loaded = deferredImport();
  const importer = vi.fn(() => loaded.promise);
  const { router, wrapper, navigate } = mountRouter(importer);
  await vi.waitFor(() => expect(wrapper.find('a').exists()).toBe(true));
  expect(router.options.defaultPendingMs).toBe(1000);
  expect(router.options.defaultPendingMinMs).toBe(500);
  expect(router.options.defaultPendingComponent).toBe(RoutePending);

  const pendingNavigation = navigate();
  await vi.waitFor(() => expect(importer).toHaveBeenCalledTimes(1));
  expect(wrapper.findComponent(RoutePending).exists()).toBe(false);
  loaded.resolve({ default: TestPage });
  await pendingNavigation;
  expect(wrapper.findComponent(TestPage).exists()).toBe(true);
  expect(wrapper.findComponent(RoutePending).exists()).toBe(false);
});
