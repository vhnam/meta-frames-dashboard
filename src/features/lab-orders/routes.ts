import { createRoute } from '@tanstack/vue-router';

import { appRoute } from '#/app/appRoute';
import { lazyPage } from '#/app/lazyPage';

const labOrderListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'orders',
  component: lazyPage(() => import('./pages/LabOrderListPage.vue')),
});

function labOrderDetailProps(): () => Record<string, unknown> {
  const params = labOrderDetailRoute.useParams();
  return () => ({ orderId: params.value.orderId });
}

const labOrderDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'orders/$orderId',
  component: lazyPage(() => import('./pages/LabOrderDetailPage.vue'), labOrderDetailProps),
});

export const labOrdersRoutes = [labOrderListRoute, labOrderDetailRoute];
