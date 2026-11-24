import { createRoute } from '@tanstack/vue-router';

import { appRoute } from '#/app/appRoute';
import { lazyPage } from '#/app/lazyPage';

export const auditRoutes = [
  createRoute({
    getParentRoute: () => appRoute,
    path: 'audit',
    component: lazyPage(() => import('./pages/AuditLogPage.vue')),
  }),
];
