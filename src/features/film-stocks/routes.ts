import { createRoute } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import { rootRoute } from "#/layouts/rootRoute";
import InventoryPage from "./pages/InventoryPage.vue";
import StockDetailPage from "./pages/StockDetailPage.vue";
import StockListPage from "./pages/StockListPage.vue";

const stockListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stocks",
  component: StockListPage,
});

function StockDetailRoute(): VNode {
  return h(StockDetailPage, { stockId: stockDetailRoute.useParams().value.stockId });
}

const stockDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stocks/$stockId",
  component: StockDetailRoute,
});

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory",
  component: InventoryPage,
});

export const filmStocksRoutes = [stockListRoute, stockDetailRoute, inventoryRoute];
