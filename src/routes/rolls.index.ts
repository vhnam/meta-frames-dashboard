import { createFileRoute } from "@tanstack/vue-router";
import RollsView from "#/views/RollsView.vue";

export const Route = createFileRoute("/rolls/")({ component: RollsView });
