import "./style.css";
import "vue-sonner/style.css";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { RouterProvider, createRouter } from "@tanstack/vue-router";
import { createApp, h } from "vue";
import { queryClient } from "./api/client";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/vue-router" {
  interface Register {
    router: typeof router;
  }
}

createApp({ render: () => h(RouterProvider, { router }) })
  .use(VueQueryPlugin, { queryClient })
  .mount("#app");
