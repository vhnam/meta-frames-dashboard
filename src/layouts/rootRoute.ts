import { createRootRoute } from "@tanstack/vue-router";
import { parseListSearch } from "#/shared/lib/listSearch";
import DashboardLayout from "./DashboardLayout.vue";

export const rootRoute = createRootRoute({
  component: DashboardLayout,
  validateSearch: parseListSearch,
});
