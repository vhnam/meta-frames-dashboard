import { createRoute } from "@tanstack/vue-router";
import { rootRoute } from "#/layouts/rootRoute";
import AuditLogPage from "./pages/AuditLogPage.vue";

export const auditRoutes = [
  createRoute({ getParentRoute: () => rootRoute, path: "/audit", component: AuditLogPage }),
];
