import { createRootRoute } from "@tanstack/vue-router";
import { parseListSearch } from "#/shared/lib/listSearch";
import NotFoundPage from "./NotFoundPage.vue";
import RootLayout from "./RootLayout.vue";

export const rootRoute = createRootRoute({
  component: RootLayout,
  validateSearch: parseListSearch,
  notFoundComponent: NotFoundPage,
});
