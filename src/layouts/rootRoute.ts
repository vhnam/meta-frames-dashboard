import { createRootRoute } from "@tanstack/vue-router";
import { parseListSearch } from "#/shared/lib/listSearch";
import RootLayout from "./RootLayout.vue";

export const rootRoute = createRootRoute({
  component: RootLayout,
  validateSearch: parseListSearch,
});
