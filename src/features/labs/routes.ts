import { createRoute } from "@tanstack/vue-router";
import { rootRoute } from "#/layouts/rootRoute";
import LabListPage from "./pages/LabListPage.vue";

export const labsRoutes = [
  createRoute({ getParentRoute: () => rootRoute, path: "/labs", component: LabListPage }),
];
