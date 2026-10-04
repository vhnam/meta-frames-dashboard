import { createFileRoute } from "@tanstack/vue-router";
import StocksView from "#/views/StocksView.vue";

export const Route = createFileRoute("/stocks/")({ component: StocksView });
