import { createRootRoute } from "@tanstack/vue-router";
import DashboardLayout from "./DashboardLayout.vue";

export const rootRoute = createRootRoute({ component: DashboardLayout });
