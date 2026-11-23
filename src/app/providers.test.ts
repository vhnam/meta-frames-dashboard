// @vitest-environment happy-dom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/vue-router';
import { flushPromises } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { createApp, defineComponent, h, onMounted, type Component } from 'vue';
import { toast, Toaster } from 'vue-sonner';

import RootLayout from '#/layouts/root/RootLayout.vue';

import { installProviders } from './providers';
import { router as dashboardRouter } from './router';

const message = 'Something went wrong. Reload the page if it keeps happening.';
const toastOptions = expect.objectContaining({
  id: 'unexpected-error',
  action: expect.objectContaining({ label: 'Close' }),
});

function mountApp(component: Component) {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp(component);
  installProviders(app);
  app.mount(container);
  return {
    container,
    unmount: () => {
      app.unmount();
      container.remove();
    },
  };
}

afterEach(() => vi.restoreAllMocks());

it.each(['setup function', 'mounted hook', 'native event handler'])(
  'logs and reports an error from a %s',
  async (source) => {
    const error = new Error('Unexpected component error');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const report = vi.spyOn(toast, 'error').mockImplementation(() => 'unexpected-error');
    const fail = () => {
      throw error;
    };
    const app = mountApp(
      defineComponent({
        setup() {
          if (source === 'setup function') fail();
          if (source === 'mounted hook') onMounted(fail);
          return () => h('button', { onClick: fail });
        },
      }),
    );

    try {
      if (source === 'native event handler') app.container.querySelector('button')?.click();
      expect(log).toHaveBeenCalledExactlyOnceWith(error, source);
      expect(report).toHaveBeenCalledExactlyOnceWith(message, toastOptions);
    } finally {
      app.unmount();
    }
  },
);

it('shows one toast when two event errors use the same ID', async () => {
  const first = new Error('First error');
  const second = new Error('Second error');
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const report = vi.spyOn(toast, 'error');
  const app = mountApp(() => [
    h(Toaster),
    h('button', {
      onClick: () => {
        throw first;
      },
    }),
    h('button', {
      onClick: () => {
        throw second;
      },
    }),
  ]);

  try {
    const [firstButton, secondButton] = app.container.querySelectorAll('button');
    firstButton.click();
    secondButton.click();
    await flushPromises();
    expect(log.mock.calls).toEqual([
      [first, 'native event handler'],
      [second, 'native event handler'],
    ]);
    expect(report.mock.calls).toEqual([
      [message, toastOptions],
      [message, toastOptions],
    ]);
    expect(app.container.querySelectorAll('[data-sonner-toast]')).toHaveLength(1);
  } finally {
    app.unmount();
  }
});

it('shows a setup error from the initial route on the root toaster', async () => {
  const error = new Error('Initial route setup failed');
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const report = vi.spyOn(toast, 'error');
  const rootRoute = createRootRoute({ component: RootLayout });
  const appRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/app',
    component: () => h('main', { id: 'app-layout' }, h(Outlet)),
  });
  const route = createRoute({
    getParentRoute: () => appRoute,
    path: '/broken',
    component: defineComponent({
      setup() {
        throw error;
      },
      render: () => null,
    }),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([appRoute.addChildren([route])]),
    history: createMemoryHistory({ initialEntries: ['/app/broken'] }),
    defaultErrorComponent: dashboardRouter.options.defaultErrorComponent,
    defaultOnCatch: dashboardRouter.options.defaultOnCatch,
  });
  const app = mountApp(() => h(RouterProvider, { router }));

  try {
    await vi.waitFor(() => expect(log).toHaveBeenCalled());
    await flushPromises();
    expect(log).toHaveBeenCalledExactlyOnceWith(error, 'router error boundary');
    expect(report).toHaveBeenCalledExactlyOnceWith(message, toastOptions);
    expect(app.container.querySelector('#app-layout')?.textContent).toContain(
      'Something went wrong!',
    );
    expect(app.container.querySelectorAll('[data-sonner-toast]')).toHaveLength(1);
  } finally {
    app.unmount();
  }
});
