import { createRoute, redirect } from '@tanstack/vue-router';

import { currentUser } from '#/features/auth/session';
import AppNotFoundPage from '#/layouts/dashboard/AppNotFoundPage.vue';
import DashboardLayout from '#/layouts/dashboard/DashboardLayout.vue';

import { rootRoute } from './rootRoute';

/** The signed-in dashboard. Every feature page lives under `/app`. */
export const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: DashboardLayout,
  notFoundComponent: AppNotFoundPage,
  beforeLoad: async ({ location }) => {
    if (!(await currentUser())) {
      throw redirect({ to: '/auth/login', search: { redirect: location.href } });
    }
  },
});
