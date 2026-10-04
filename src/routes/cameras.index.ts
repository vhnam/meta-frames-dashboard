import { createFileRoute } from "@tanstack/vue-router";
import CamerasView from "#/views/CamerasView.vue";

export const Route = createFileRoute("/cameras/")({ component: CamerasView });
