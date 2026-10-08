import { createRoute, redirect } from "@tanstack/vue-router";
import { currentUser } from "#/features/auth/session";
import DashboardLayout from "./DashboardLayout.vue";
import { rootRoute } from "./rootRoute";

/** The signed-in dashboard. Every feature page lives under `/app`. */
export const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: DashboardLayout,
  beforeLoad: async ({ location }) => {
    if (!(await currentUser())) {
      throw redirect({ to: "/auth/login", search: { redirect: location.href } });
    }
  },
});
