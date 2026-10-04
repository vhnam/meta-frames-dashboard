// @vitest-environment happy-dom
import { rollQueries } from "../api";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import LoadRollDialog from "./LoadRollDialog.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("LoadRollDialog", () => {
  it("shows the roll summary and requires a camera", async () => {
    const stock = server.addStock({ name: "Portra", brand: "Kodak", boxIso: 400 });
    const rec = server.addRoll({ filmStockId: stock.id, status: "in_stock" });
    const listed = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (r) => r.roll.id === rec.id,
    )!;
    // the list endpoint has no box ISO; the detail page fills it from the stock
    const row = { ...listed, boxIso: stock.boxIso };
    const wrapper = mount(LoadRollDialog, {
      attachTo: document.body,
      props: { open: false, row },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    expect(document.body.textContent).toContain("Kodak Portra");
    expect(document.body.textContent).toContain("Box speed is ISO 400");
    (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
    await flushPromises();
    expect(document.body.textContent).toContain("Select a camera.");
    expect(server.requests.some((r) => r.method === "put")).toBe(false);
    wrapper.unmount();
  });
});
