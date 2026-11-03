import { createRoute } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import { appRoute } from "#/layouts/appRoute";
import LabOrderDetailPage from "./pages/LabOrderDetailPage.vue";
import LabOrderListPage from "./pages/LabOrderListPage.vue";

const labOrderListRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "orders",
  component: LabOrderListPage,
});

function LabOrderDetailRoute(): VNode {
  return h(LabOrderDetailPage, { orderId: labOrderDetailRoute.useParams().value.orderId });
}

const labOrderDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "orders/$orderId",
  component: LabOrderDetailRoute,
});

export const labOrdersRoutes = [labOrderListRoute, labOrderDetailRoute];
