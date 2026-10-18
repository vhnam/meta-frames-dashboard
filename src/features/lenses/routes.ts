import { createRoute } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import { appRoute } from "#/layouts/appRoute";
import LensDetailPage from "./pages/LensDetailPage.vue";
import LensListPage from "./pages/LensListPage.vue";

const lensListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "lenses",
  component: LensListPage,
});

function LensDetailRoute(): VNode {
  return h(LensDetailPage, { lensId: lensDetailRoute.useParams().value.lensId });
}

const lensDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "lenses/$lensId",
  component: LensDetailRoute,
});

export const lensesRoutes = [lensListRoute, lensDetailRoute];
