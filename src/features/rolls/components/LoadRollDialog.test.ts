// @vitest-environment happy-dom
import { rollQueries } from "../api";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import FormSelect from "#/shared/components/FormSelect.vue";
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

  it("leaves out a camera that already has a roll loaded", async () => {
    const stock = server.addStock({ name: "Portra", brand: "Kodak" });
    const free = server.addCamera({ brand: "Nikon", model: "FM" });
    const busy = server.addCamera({ brand: "Nikon", model: "S2" });
    server.addRoll({ filmStockId: stock.id, cameraId: busy.id, status: "in_camera" });
    const rec = server.addRoll({ filmStockId: stock.id, status: "in_stock" });
    const row = (await queryClient.fetchQuery(rollQueries.list({}))).find(
      (r) => r.roll.id === rec.id,
    )!;
    const wrapper = mount(LoadRollDialog, {
      attachTo: document.body,
      props: { open: true, row },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await flushPromises();
    const options = () => {
      const fields = wrapper
        .findAllComponents(FormSelect)
        .map((s) => s.props() as { label: string; options: { value: string; label: string }[] });
      return fields.find((p) => p.label === "Camera")?.options;
    };
    await vi.waitFor(() => expect(options()?.map((o) => o.value)).toEqual([free.id]));
    expect(options()?.some((o) => o.value === busy.id)).toBe(false);
    wrapper.unmount();
  });
});
