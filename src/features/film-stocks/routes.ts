import { createRoute } from '@tanstack/vue-router';

import { appRoute } from '#/app/appRoute';
import { lazyPage } from '#/app/lazyPage';

const stockListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'stocks',
  component: lazyPage(() => import('./pages/StockListPage.vue')),
});

function stockDetailProps(): () => Record<string, unknown> {
  const params = stockDetailRoute.useParams();
  return () => ({ stockId: params.value.stockId });
}

const stockDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'stocks/$stockId',
  component: lazyPage(() => import('./pages/StockDetailPage.vue'), stockDetailProps),
});

export const filmStocksRoutes = [stockListRoute, stockDetailRoute];
