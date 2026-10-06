// @vitest-environment happy-dom
import { rollQueries } from "../api";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import RollEditDialog from "./RollEditDialog.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("RollEditDialog", () => {
  it("saves changed exposures through PUT /rolls/{id}", async () => {
    const stock = server.addStock({ name: "UltraMax" });
    const rec = server.addRoll({ filmStockId: stock.id, exposures: 36 });
    const [{ data: row }] = [
      {
        data: (await queryClient.fetchQuery(rollQueries.list({}))).find(
          (r) => r.roll.id === rec.id,
        )!,
      },
    ];
    const wrapper = mount(RollEditDialog, {
      attachTo: document.body,
      props: { open: false, row },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    const exposures = [...document.body.querySelectorAll("input")].find((i) => i.value === "36")!;
    exposures.value = "24";
    exposures.dispatchEvent(new Event("input", { bubbles: true }));
    const year = document.body.querySelector('input[placeholder="e.g. 2027"]') as HTMLInputElement;
    year.value = "2028";
    year.dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();
    (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(server.rolls[0].exposures).toBe(24));
    // the API reads a nested expiry object and ignores flat expiryYear / expiryMonth
    const put = server.requests.find((r) => r.method === "put")!.body as Record<string, unknown>;
    expect(put).toMatchObject({ expiry: { year: 2028 } });
    expect(Object.keys(put).sort((a, b) => a.localeCompare(b))).toEqual([
      "expiry",
      "exposures",
      "filmStockId",
      "format",
    ]);
    expect(server.rolls[0].expiry).toEqual({ year: 2028, month: undefined });
    wrapper.unmount();
  });
});
