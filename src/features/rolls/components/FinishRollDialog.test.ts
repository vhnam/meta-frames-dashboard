// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import type { RollRow } from "../types";
import FinishRollDialog from "./FinishRollDialog.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const today = () => new Date().toLocaleDateString("en-CA");

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

async function mountDialog(startDate: string | null) {
  const stock = server.addStock({ name: "Portra" });
  const rec = server.addRoll({ filmStockId: stock.id, status: "in_camera" });
  const row = { roll: { id: rec.id, startDate } } as RollRow;
  const wrapper = mount(FinishRollDialog, {
    attachTo: document.body,
    props: { open: false, row },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });
  await wrapper.setProps({ open: true } as never);
  await flushPromises();
  const input = document.body.querySelector("input[type=date]") as HTMLInputElement;
  return { wrapper, rec, input };
}
const pick = async (input: HTMLInputElement, date: string) => {
  input.value = date;
  input.dispatchEvent(new Event("input"));
  await flushPromises();
};
const submit = async () => {
  (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
  await flushPromises();
};
const finishPut = (id: string) =>
  server.requests.find((request) => request.url === `/rolls/${id}/finish`);

describe("FinishRollDialog", () => {
  it("starts on today and sends it", async () => {
    const { wrapper, rec, input } = await mountDialog("2026-01-01");
    expect(input.value).toBe(today());
    await submit();
    await vi.waitFor(() => expect(finishPut(rec.id)?.body).toEqual({ date: today() }));
    wrapper.unmount();
  });
  it("sends the date the user picks", async () => {
    const { wrapper, rec, input } = await mountDialog("2026-01-01");
    await pick(input, "2026-02-03");
    await submit();
    await vi.waitFor(() => expect(finishPut(rec.id)?.body).toEqual({ date: "2026-02-03" }));
    wrapper.unmount();
  });
  it("refuses a date before the roll was loaded", async () => {
    const { wrapper, rec, input } = await mountDialog("2026-01-10");
    await pick(input, "2026-01-09");
    await submit();
    expect(document.body.textContent).toContain("cannot be before the roll was loaded");
    expect(finishPut(rec.id)).toBeUndefined();
    wrapper.unmount();
  });
  it("refuses a date in the future", async () => {
    const { wrapper, rec, input } = await mountDialog("2026-01-10");
    await pick(input, "2999-01-01");
    await submit();
    expect(document.body.textContent).toContain("cannot be in the future");
    expect(finishPut(rec.id)).toBeUndefined();
    wrapper.unmount();
  });
});
