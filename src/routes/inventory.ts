import { createFileRoute } from "@tanstack/vue-router";
import InventoryView from "#/views/InventoryView.vue";

export const Route = createFileRoute("/inventory")({ component: InventoryView });
