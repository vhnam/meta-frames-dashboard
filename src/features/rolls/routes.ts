import { createRoute, redirect } from '@tanstack/vue-router';

import { appRoute } from '#/app/appRoute';
import { lazyPage } from '#/app/lazyPage';

import { parseRollListSearch } from './rollList';

function rollListProps(): () => Record<string, unknown> {
  const search = rollListRoute.useSearch();
  // only the Rolls keys: the pager's page and pageSize belong to the table
  return () => ({ search: parseRollListSearch(search.value) });
}

const rollListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'rolls',
  validateSearch: parseRollListSearch,
  component: lazyPage(() => import('./pages/RollListPage.vue'), rollListProps),
});

function rollDetailProps(): () => Record<string, unknown> {
  const params = rollDetailRoute.useParams();
  return () => ({ rollId: params.value.rollId });
}

const rollDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'rolls/$rollId',
  component: lazyPage(() => import('./pages/RollDetailPage.vue'), rollDetailProps),
});

// the old Inventory and Expiry pages now live on Rolls → In stock
const inventoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'inventory',
  beforeLoad: () => {
    throw redirect({
      to: '/app/rolls',
      search: { tab: 'in_stock', group: 'stock' },
      replace: true,
    });
  },
});

const expiryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'expiry',
  beforeLoad: () => {
    throw redirect({
      to: '/app/rolls',
      search: { tab: 'in_stock', expiry: 'alert' },
      replace: true,
    });
  },
});

export const rollsRoutes = [rollListRoute, rollDetailRoute, inventoryRoute, expiryRoute];
