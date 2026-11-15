import { createRoute } from '@tanstack/vue-router';

import { appRoute } from '#/app/appRoute';

import AuditLogPage from './pages/AuditLogPage.vue';

export const auditRoutes = [
  createRoute({ getParentRoute: () => appRoute, path: 'audit', component: AuditLogPage }),
];
