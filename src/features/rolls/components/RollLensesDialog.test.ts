// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import RollLensesDialog from "./RollLensesDialog.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("RollLensesDialog", () => {
  it("saves the picked lenses through PUT /rolls/{id}/lenses", async () => {
    const stock = server.addStock({ name: "Portra" });
    const roll = server.addRoll({ filmStockId: stock.id });
    const wrapper = mount(RollLensesDialog, {
      attachTo: document.body,
      props: {
        open: false,
        rollId: roll.id,
        selectedIds: [],
        candidates: [
          {
            id: "l1",
            brand: "Nikon",
            model: "50mm",
            mount: "F",
            focalLength: 50,
            maxAperture: 1.8,
          },
        ] as never,
      },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    (document.body.querySelector("[data-slot=checkbox]") as HTMLButtonElement).click();
    await flushPromises();
    (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(server.rolls[0].lensIds).toEqual(["l1"]));
    wrapper.unmount();
  });
});
