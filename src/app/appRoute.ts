import { createRoute, redirect, type NotFoundRouteComponent } from '@tanstack/vue-router';

import { currentUser } from '#/features/auth/session';

import { lazyPage } from './lazyPage';
import { rootRoute } from './rootRoute';

/** The signed-in dashboard. Every feature page lives under `/app`. */
export const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: lazyPage(() => import('#/layouts/dashboard/DashboardLayout.vue')),
  // typed as the router's own not-found type: the lazy page type makes `appRoute` refer to itself
  notFoundComponent: lazyPage(
    () => import('#/layouts/dashboard/AppNotFoundPage.vue'),
  ) as unknown as NotFoundRouteComponent,
  beforeLoad: async ({ location }) => {
    if (!(await currentUser())) {
      throw redirect({ to: '/auth/login', search: { redirect: location.href } });
    }
  },
});
