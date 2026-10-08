import { createRoute } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import { appRoute } from "#/layouts/appRoute";
import CameraDetailPage from "./pages/CameraDetailPage.vue";
import CameraListPage from "./pages/CameraListPage.vue";

const cameraListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "cameras",
  component: CameraListPage,
});

function CameraDetailRoute(): VNode {
  return h(CameraDetailPage, { cameraId: cameraDetailRoute.useParams().value.cameraId });
}

const cameraDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "cameras/$cameraId",
  component: CameraDetailRoute,
});

export const camerasRoutes = [cameraListRoute, cameraDetailRoute];
