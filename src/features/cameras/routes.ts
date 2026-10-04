import { createRoute } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import { rootRoute } from "#/layouts/rootRoute";
import CameraDetailPage from "./pages/CameraDetailPage.vue";
import CameraListPage from "./pages/CameraListPage.vue";

const cameraListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cameras",
  component: CameraListPage,
});

function CameraDetailRoute(): VNode {
  return h(CameraDetailPage, { cameraId: cameraDetailRoute.useParams().value.cameraId });
}

const cameraDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cameras/$cameraId",
  component: CameraDetailRoute,
});

export const camerasRoutes = [cameraListRoute, cameraDetailRoute];
