import { createFileRoute, redirect } from "@tanstack/vue-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/rolls" });
  },
});
