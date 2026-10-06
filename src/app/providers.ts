import { VueQueryPlugin } from "@tanstack/vue-query";
import type { App } from "vue";
import { queryClient } from "#/shared/api/client";

/** Installs app-wide plugins (server state, ...). */
export function installProviders(app: App) {
  app.use(VueQueryPlugin, { queryClient });
}
