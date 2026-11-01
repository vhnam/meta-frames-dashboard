import { createRoute } from "@tanstack/vue-router";
import { appRoute } from "#/layouts/appRoute";
import ScannerListPage from "./pages/ScannerListPage.vue";

export const scannersRoutes = [
  createRoute({ getParentRoute: () => appRoute, path: "scanners", component: ScannerListPage }),
];
