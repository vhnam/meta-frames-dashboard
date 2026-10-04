import { createFileRoute } from "@tanstack/vue-router";
import { h, type VNode } from "vue";
import CameraDetailView from "#/views/CameraDetailView.vue";

function RouteView(): VNode {
  return h(CameraDetailView, { cameraId: Route.useParams().value.cameraId });
}

export const Route = createFileRoute("/cameras/$cameraId")({ component: RouteView });
