import { createRoute } from '@tanstack/vue-router';

import { appRoute } from '#/app/appRoute';
import { lazyPage } from '#/app/lazyPage';

const lensListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'lenses',
  component: lazyPage(() => import('./pages/LensListPage.vue')),
});

function lensDetailProps(): () => Record<string, unknown> {
  const params = lensDetailRoute.useParams();
  return () => ({ lensId: params.value.lensId });
}

const lensDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'lenses/$lensId',
  component: lazyPage(() => import('./pages/LensDetailPage.vue'), lensDetailProps),
});

export const lensesRoutes = [lensListRoute, lensDetailRoute];
