import { createFileRoute } from "@tanstack/vue-router";
import ExpiryView from "#/views/ExpiryView.vue";

export const Route = createFileRoute("/expiry")({ component: ExpiryView });
