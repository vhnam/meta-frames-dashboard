import { createRoute } from '@tanstack/vue-router';

import { appRoute } from '#/app/appRoute';
import { lazyPage } from '#/app/lazyPage';

export const labsRoutes = [
  createRoute({
    getParentRoute: () => appRoute,
    path: 'labs',
    component: lazyPage(() => import('./pages/LabListPage.vue')),
  }),
];
