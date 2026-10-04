import { createFileRoute } from "@tanstack/vue-router";
import LabsView from "#/views/LabsView.vue";

export const Route = createFileRoute("/labs")({ component: LabsView });
