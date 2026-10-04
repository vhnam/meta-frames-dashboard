import { createFileRoute } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import StockDetailView from "#/views/StockDetailView.vue";

function RouteView(): VNode {
  return h(StockDetailView, { stockId: Route.useParams().value.stockId });
}

export const Route = createFileRoute("/stocks/$stockId")({ component: RouteView });
