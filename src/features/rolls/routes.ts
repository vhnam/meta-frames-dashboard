import { createRoute } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import { appRoute } from "#/layouts/appRoute";
import ExpiryPage from "./pages/ExpiryPage.vue";
import RollDetailPage from "./pages/RollDetailPage.vue";
import RollListPage from "./pages/RollListPage.vue";

const rollListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "rolls",
  component: RollListPage,
});

function RollDetailRoute(): VNode {
  return h(RollDetailPage, { rollId: rollDetailRoute.useParams().value.rollId });
}

const rollDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "rolls/$rollId",
  component: RollDetailRoute,
});

const expiryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "expiry",
  component: ExpiryPage,
});

export const rollsRoutes = [rollListRoute, rollDetailRoute, expiryRoute];
