import { createRoute } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import { rootRoute } from "#/layouts/rootRoute";
import ExpiryPage from "./pages/ExpiryPage.vue";
import RollDetailPage from "./pages/RollDetailPage.vue";
import RollListPage from "./pages/RollListPage.vue";

const rollListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rolls",
  component: RollListPage,
});

function RollDetailRoute(): VNode {
  return h(RollDetailPage, { rollId: rollDetailRoute.useParams().value.rollId });
}

const rollDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rolls/$rollId",
  component: RollDetailRoute,
});

const expiryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/expiry",
  component: ExpiryPage,
});

export const rollsRoutes = [rollListRoute, rollDetailRoute, expiryRoute];
