import { createRoute } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import { appRoute } from "#/layouts/appRoute";
import InventoryPage from "./pages/InventoryPage.vue";
import StockDetailPage from "./pages/StockDetailPage.vue";
import StockListPage from "./pages/StockListPage.vue";

const stockListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "stocks",
  component: StockListPage,
});

function StockDetailRoute(): VNode {
  return h(StockDetailPage, { stockId: stockDetailRoute.useParams().value.stockId });
}

const stockDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "stocks/$stockId",
  component: StockDetailRoute,
});

const inventoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "inventory",
  component: InventoryPage,
});

export const filmStocksRoutes = [stockListRoute, stockDetailRoute, inventoryRoute];
