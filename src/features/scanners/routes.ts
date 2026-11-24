import { createRoute } from '@tanstack/vue-router';

import { appRoute } from '#/app/appRoute';
import { lazyPage } from '#/app/lazyPage';

export const scannersRoutes = [
  createRoute({
    getParentRoute: () => appRoute,
    path: 'scanners',
    component: lazyPage(() => import('./pages/ScannerListPage.vue')),
  }),
];
