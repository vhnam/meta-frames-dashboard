import { createRoute } from '@tanstack/vue-router';

import { appRoute } from '#/app/appRoute';
import { lazyPage } from '#/app/lazyPage';

const cameraListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'cameras',
  component: lazyPage(() => import('./pages/CameraListPage.vue')),
});

function cameraDetailProps(): () => Record<string, unknown> {
  const params = cameraDetailRoute.useParams();
  return () => ({ cameraId: params.value.cameraId });
}

const cameraDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: 'cameras/$cameraId',
  component: lazyPage(() => import('./pages/CameraDetailPage.vue'), cameraDetailProps),
});

export const camerasRoutes = [cameraListRoute, cameraDetailRoute];
