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

let mounted: VueWrapper | undefined;

beforeEach(() => {
  server.reset();
  queryClient.clear();
  // signed in, so the /app guard lets the navigation through
  queryClient.setQueryData(authKeys.me(), {
    id: "u1",
    email: "ansel@example.com",
    name: "Ansel",
    createdAt: "2026-10-07T09:00:00Z",
  });
});

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
});

const open = async (href: string) => {
  await router.navigate({ href });
  mounted = mount(() => h(RouterProvider, { router }), {
    attachTo: document.body,
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });
  return mounted;
};
const search = () => router.state.location.search as Record<string, unknown>;

describe("old Inventory and Expiry links", () => {
  it.each([
    ["/app/inventory", { tab: "in_stock", group: "stock" }],
    ["/app/expiry", { tab: "in_stock", expiry: "alert" }],
  ])("%s opens Rolls → In stock", async (href, expected) => {
    await router.navigate({ href });
    await router.load();
    expect(router.state.location.pathname).toBe("/app/rolls");
    expect(router.state.location.search).toMatchObject(expected);
  });
});

describe("Rolls page URL", () => {
  it("keeps the tab and filter when the table changes page", async () => {
    for (let index = 0; index < 25; index += 1) server.addRoll({});
    const view = await open("/app/rolls?tab=in_stock&expiry=undated");
    const next = () => view.find('[data-slot="pagination-next"]').trigger("click");
    await vi.waitFor(() => expect(view.findAll("tbody tr")).toHaveLength(10));
    await next();
    await vi.waitFor(() => expect(search().page).toBe(2));
    // a second click goes on to page 3, not back to page 1
    await next();
    await vi.waitFor(() => expect(search().page).toBe(3));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(search()).toMatchObject({ tab: "in_stock", expiry: "undated", page: 3 });
    expect(view.findAll("tbody tr")).toHaveLength(5);
  });

  it("opens a group on its first page, not the groups list's page", async () => {
    for (let index = 1; index <= 11; index += 1)
      server.addRoll({ filmStockId: server.addStock({ name: `A${index}` }).id });
    const zeta = server.addStock({ name: "Zeta" });
    for (let index = 0; index < 12; index += 1) server.addRoll({ filmStockId: zeta.id });
    const view = await open("/app/rolls?tab=in_stock&group=stock&page=2");
    const zetaRow = () =>
      view.findAll("tbody tr").find((row) => row.attributes("aria-label")?.includes("Zeta"));
    await vi.waitFor(() => expect(zetaRow()).toBeDefined());
    await zetaRow()!.trigger("click");
    await vi.waitFor(() => expect(search().stock).toBe(zeta.id));
    expect(search().page).toBeUndefined();
    await vi.waitFor(() => expect(view.findAll("tbody tr")).toHaveLength(10));
  });

  it("Back from a roll returns to the same tab, group, filters and ISO range", async () => {
    sessionStorage.clear();
    const stock = server.addStock({ name: "Wide", boxIso: "100-400" });
    server.addRoll({ filmStockId: stock.id });
    const listing = `/app/rolls?tab=in_stock&group=stock&expiry=undated&iso=100-400&stock=${stock.id}`;
    const view = await open(listing);
    await vi.waitFor(() => expect(view.findAll("tbody tr")).toHaveLength(1));
    await router.navigate({ to: "/app/rolls/$rollId", params: { rollId: "roll-1" } });
    const back = () => view.find('a[aria-label="Back to Rolls"]');
    await vi.waitFor(() => expect(back().exists()).toBe(true));
    await back().trigger("click");
    await vi.waitFor(() => expect(router.state.location.pathname).toBe("/app/rolls"));
    expect(search()).toMatchObject({
      tab: "in_stock",
      group: "stock",
      expiry: "undated",
      iso: "100-400",
      stock: stock.id,
    });
  });
});
