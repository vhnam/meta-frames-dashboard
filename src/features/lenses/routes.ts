import { createRoute } from "@tanstack/vue-router";
import { rootRoute } from "#/layouts/rootRoute";
import LensListPage from "./pages/LensListPage.vue";

export const lensesRoutes = [
  createRoute({ getParentRoute: () => rootRoute, path: "/lenses", component: LensListPage }),
];
