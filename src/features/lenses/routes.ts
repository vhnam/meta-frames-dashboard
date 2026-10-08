import { createRoute } from "@tanstack/vue-router";
import { appRoute } from "#/layouts/appRoute";
import LensListPage from "./pages/LensListPage.vue";

export const lensesRoutes = [
  createRoute({ getParentRoute: () => appRoute, path: "lenses", component: LensListPage }),
];
