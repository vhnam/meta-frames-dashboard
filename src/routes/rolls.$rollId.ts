import { createFileRoute } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import RollDetailView from "#/views/RollDetailView.vue";

function RouteView(): VNode {
  return h(RollDetailView, { rollId: Route.useParams().value.rollId });
}

export const Route = createFileRoute("/rolls/$rollId")({ component: RouteView });
