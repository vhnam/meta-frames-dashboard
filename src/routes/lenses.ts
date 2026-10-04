import { createFileRoute } from "@tanstack/vue-router";
import LensesView from "#/views/LensesView.vue";

export const Route = createFileRoute("/lenses")({ component: LensesView });
