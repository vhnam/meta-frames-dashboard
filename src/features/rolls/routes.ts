import { createRoute, redirect } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import { appRoute } from "#/layouts/appRoute";
import RollDetailPage from "./pages/RollDetailPage.vue";
import RollListPage from "./pages/RollListPage.vue";
import { parseRollListSearch } from "./rollList";

function RollListRoute(): VNode {
  // only the Rolls keys: the pager's page and pageSize belong to the table
  return h(RollListPage, { search: parseRollListSearch(rollListRoute.useSearch().value) });
}

const rollListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "rolls",
  validateSearch: parseRollListSearch,
  component: RollListRoute,
});

function RollDetailRoute(): VNode {
  return h(RollDetailPage, { rollId: rollDetailRoute.useParams().value.rollId });
}

const rollDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "rolls/$rollId",
  component: RollDetailRoute,
});

// the old Inventory and Expiry pages now live on Rolls → In stock
const inventoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "inventory",
  beforeLoad: () => {
    throw redirect({
      to: "/app/rolls",
      search: { tab: "in_stock", group: "stock" },
      replace: true,
    });
  },
});

const expiryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "expiry",
  beforeLoad: () => {
    throw redirect({
      to: "/app/rolls",
      search: { tab: "in_stock", expiry: "alert" },
      replace: true,
    });
  },
});

export const rollsRoutes = [rollListRoute, rollDetailRoute, inventoryRoute, expiryRoute];
