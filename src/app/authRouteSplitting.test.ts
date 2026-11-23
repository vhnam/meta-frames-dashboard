// @vitest-environment happy-dom
import { createMemoryHistory, createRouter, Outlet, RouterProvider } from '@tanstack/vue-router';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import { defineComponent, h } from 'vue';

import { currentUser } from '#/features/auth/session';

import { installProviders } from './providers';
import { router as dashboardRouter } from './router';

const { loadDashboardLayout } = vi.hoisted(() => ({ loadDashboardLayout: vi.fn() }));

vi.mock('#/features/auth/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/features/auth/session')>()),
  currentUser: vi.fn(),
}));

vi.mock('#/layouts/dashboard/DashboardLayout.vue', () => {
  loadDashboardLayout();
  return { default: defineComponent({ name: 'DashboardLayout', render: () => h(Outlet) }) };
});

enableAutoUnmount(afterEach);
beforeEach(() => vi.mocked(currentUser).mockResolvedValue(null));

function openRoute(path: string) {
  const router = createRouter({
    ...dashboardRouter.options,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const wrapper = mount(() => h(RouterProvider, { router }), {
    global: { plugins: [installProviders] },
  });
  return { router, wrapper };
}

it.each([
  {
    href: '/auth/login?redirect=%2Fapp%2Flabs&error=google_denied&token=ignored',
    page: 'LoginPage',
    props: { redirect: '/app/labs', error: 'google_denied' },
    attrs: { token: 'ignored' },
  },
  {
    href: '/auth/register?redirect=%2Fapp%2Flabs&error=ignored&token=ignored',
    page: 'RegisterPage',
    props: { redirect: '/app/labs' },
  },
  {
    href: '/auth/recover?token=ignored&redirect=ignored',
    page: 'RecoverPage',
    props: {},
  },
  {
    href: '/auth/recover/end?token=reset-token&redirect=ignored&error=ignored',
    page: 'ResetPasswordPage',
    props: { token: 'reset-token' },
  },
])('maps search values to $page props', async ({ href, page, props, attrs = {} }) => {
  const { wrapper } = openRoute(href);
  await vi.waitFor(() => expect(wrapper.findComponent({ name: page }).exists()).toBe(true));
  const mountedPage = wrapper.getComponent({ name: page });
  expect(mountedPage.props()).toEqual(props);
  expect(mountedPage.vm.$attrs).toEqual(attrs);
});

it.each([
  { from: '/login', to: '/auth/login', query: '?error=google_denied&redirect=%2Fapp%2Flabs' },
  { from: '/recover/end', to: '/auth/recover/end', query: '?token=reset%2Btoken%3D' },
])('forwards the legacy $from query to $to', async ({ from, to, query }) => {
  const { router } = openRoute(`${from}${query}`);
  await vi.waitFor(() => expect(router.state.location.href).toBe(`${to}${query}`));
});

it('skips the dashboard module for a guest and loads the dashboard fallback for a signed-in user', async () => {
  const { router, wrapper } = openRoute('/app?source=bookmark#section');
  await vi.waitFor(() => expect(wrapper.findComponent({ name: 'LoginPage' }).exists()).toBe(true));
  expect(router.state.location.pathname).toBe('/auth/login');
  expect(router.state.location.search.redirect).toBe('/app?source=bookmark#section');
  expect(loadDashboardLayout).not.toHaveBeenCalled();

  vi.mocked(currentUser).mockResolvedValue({
    id: '5a0c2f6e-8d31-4b7a-9e15-3c7f1d2b4a60',
    email: 'ansel@example.com',
    name: 'Ansel',
    createdAt: '2026-10-07T09:00:00Z',
  });
  await router.navigate({ href: '/app/unknown-route' });
  await vi.waitFor(() =>
    expect(
      wrapper
        .getComponent({ name: 'DashboardLayout' })
        .findComponent({ name: 'AppNotFoundPage' })
        .exists(),
    ).toBe(true),
  );
  expect(loadDashboardLayout).toHaveBeenCalledTimes(1);
});
