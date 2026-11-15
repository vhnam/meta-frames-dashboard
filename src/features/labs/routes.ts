import { createRoute } from '@tanstack/vue-router';

import { appRoute } from '#/app/appRoute';

import LabListPage from './pages/LabListPage.vue';

export const labsRoutes = [
  createRoute({ getParentRoute: () => appRoute, path: 'labs', component: LabListPage }),
];
