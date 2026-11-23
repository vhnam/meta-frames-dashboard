import { createRoute, redirect } from '@tanstack/vue-router';

import { lazyPage } from '#/app/lazyPage';
import { rootRoute } from '#/app/rootRoute';

import { currentUser, safeRedirect } from './session';

const text = (value: unknown) => (typeof value === 'string' && value ? value : undefined);

/** Login, register and recovery are for visitors: a signed-in user goes on to the app. */
async function guestOnly({ search }: { search: { redirect?: string } }) {
  const user = await currentUser().catch(() => null);
  if (user) throw redirect({ href: safeRedirect(search.redirect) });
}

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: lazyPage(() => import('./components/auth-layout/AuthLayout.vue')),
});

const authIndexRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/auth/login' });
  },
});

function loginProps(): () => Record<string, unknown> {
  const search = loginRoute.useSearch();
  return () => search.value;
}

const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: 'login',
  validateSearch: (search: Record<string, unknown>): { redirect?: string; error?: string } => ({
    redirect: text(search.redirect),
    error: text(search.error),
  }),
  beforeLoad: guestOnly,
  component: lazyPage(() => import('./pages/LoginPage.vue'), loginProps),
});

function registerProps(): () => Record<string, unknown> {
  const search = registerRoute.useSearch();
  return () => ({ redirect: search.value.redirect });
}

const registerRoute = createRoute({
  getParentRoute: () => authRoute,
  path: 'register',
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: text(search.redirect),
  }),
  beforeLoad: guestOnly,
  component: lazyPage(() => import('./pages/RegisterPage.vue'), registerProps),
});

const recoverRoute = createRoute({
  getParentRoute: () => authRoute,
  path: 'recover',
  beforeLoad: () => guestOnly({ search: {} }),
  component: lazyPage(() => import('./pages/RecoverPage.vue')),
});

function resetPasswordProps(): () => Record<string, unknown> {
  const search = resetPasswordRoute.useSearch();
  return () => ({ token: search.value.token });
}

const resetPasswordRoute = createRoute({
  getParentRoute: () => authRoute,
  path: 'recover/end',
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: text(search.token),
  }),
  component: lazyPage(() => import('./pages/ResetPasswordPage.vue'), resetPasswordProps),
});

// The API sends the browser to `{APP_URL}/login?error=...` (Google) and
// `{APP_URL}/recover/end?token=...` (recovery email): forward both, query and all.
const legacyLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/auth/login${location.searchStr}` });
  },
});

const legacyResetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/recover/end',
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/auth/recover/end${location.searchStr}` });
  },
});

export const authRoutes = [
  authRoute.addChildren([
    authIndexRoute,
    loginRoute,
    registerRoute,
    recoverRoute,
    resetPasswordRoute,
  ]),
  legacyLoginRoute,
  legacyResetRoute,
];
