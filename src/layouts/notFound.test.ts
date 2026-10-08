// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { RouterProvider } from "@tanstack/vue-router";
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { h } from "vue";
import { router } from "#/app/router";
import { authKeys } from "#/features/auth";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";

installFakeServer();

const signIn = () =>
  queryClient.setQueryData(authKeys.me(), {
    id: "u1",
    email: "ansel@example.com",
    name: "Ansel",
    createdAt: "2026-10-07T09:00:00Z",
  });

let mounted: VueWrapper | undefined;

const open = async (href: string) => {
  await router.navigate({ href });
  const w = mount(() => h(RouterProvider, { router }), {
    attachTo: document.body,
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });
  mounted = w;
  await vi.waitFor(() => expect(w.text()).toContain("Page not found"));
  return w;
};

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
});

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("not found pages", () => {
  it("shows the public 404 for an unknown path outside /app", async () => {
    const w = await open("/nope");
    expect(w.find('[data-slot="sidebar"]').exists()).toBe(false);
    expect(w.text()).toContain("Go to home");
  });

  it("shows the public 404 for an unknown path under /auth", async () => {
    const w = await open("/auth/nope");
    expect(w.text()).toContain("Go to home");
  });

  it("shows the dashboard 404 inside the app shell for an unknown path under /app", async () => {
    signIn();
    const w = await open("/app/nope");
    expect(w.find('[data-slot="sidebar"]').exists()).toBe(true);
    expect(w.text()).toContain("Back to rolls");
  });

  it("sends a visitor to login instead of the dashboard 404", async () => {
    queryClient.setQueryData(authKeys.me(), null);
    await router.navigate({ href: "/app/nope" });
    expect(router.state.location.pathname).toBe("/auth/login");
  });
});
