import { createRoute, createRouter, redirect } from "@tanstack/vue-router";
import { appRoute } from "#/layouts/appRoute";
import { rootRoute } from "#/layouts/rootRoute";
import { queryClient } from "#/shared/api/client";
import { setUnauthorizedHandler } from "#/shared/api/http";
import { auditRoutes } from "#/features/audit/routes";
import { authKeys } from "#/features/auth";
import { authRoutes } from "#/features/auth/routes";
import { camerasRoutes } from "#/features/cameras/routes";
import { filmStocksRoutes } from "#/features/film-stocks/routes";
import { labsRoutes } from "#/features/labs/routes";
import { lensesRoutes } from "#/features/lenses/routes";
import { rollsRoutes } from "#/features/rolls/routes";

// `/` is kept for public pages (landing, about, ...); until then it opens the app.
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});

const appIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/app/rolls" });
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  ...authRoutes,
  appRoute.addChildren([
    appIndexRoute,
    ...rollsRoutes,
    ...camerasRoutes,
    ...lensesRoutes,
    ...filmStocksRoutes,
    ...labsRoutes,
    ...auditRoutes,
  ]),
]);

export const router = createRouter({ routeTree });

// The session ended on the server (logout elsewhere, password reset): back to login.
setUnauthorizedHandler(() => {
  queryClient.setQueryData(authKeys.me(), null);
  const { pathname, href } = router.state.location;
  if (pathname.startsWith("/app")) {
    void router.navigate({ to: "/auth/login", search: { redirect: href } });
  }
});

declare module "@tanstack/vue-router" {
  interface Register {
    router: typeof router;
  }
}
