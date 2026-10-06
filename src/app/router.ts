import { createRoute, createRouter, redirect } from "@tanstack/vue-router";
import { rootRoute } from "#/layouts/rootRoute";
import { auditRoutes } from "#/features/audit/routes";
import { camerasRoutes } from "#/features/cameras/routes";
import { filmStocksRoutes } from "#/features/film-stocks/routes";
import { labsRoutes } from "#/features/labs/routes";
import { lensesRoutes } from "#/features/lenses/routes";
import { rollsRoutes } from "#/features/rolls/routes";

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/rolls" });
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  ...rollsRoutes,
  ...camerasRoutes,
  ...lensesRoutes,
  ...filmStocksRoutes,
  ...labsRoutes,
  ...auditRoutes,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/vue-router" {
  interface Register {
    router: typeof router;
  }
}
