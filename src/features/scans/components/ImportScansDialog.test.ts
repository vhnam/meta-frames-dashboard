// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { http } from "#/shared/api/http";
import type { RollJob } from "#/features/rolls";
import { SelectStub } from "#/test/selectStub";
import ImportScansDialog from "./ImportScansDialog.vue";

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const job = { id: "job-1", scanOrders: [] } as unknown as RollJob;

beforeEach(() => queryClient.clear());
afterEach(() => vi.restoreAllMocks());

function pickFiles(...names: string[]) {
  const input = document.querySelector<HTMLInputElement>("#import-files")!;
  Object.defineProperty(input, "files", {
    value: names.map((name) => new File(["x"], name)),
    configurable: true,
  });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

const frameInputs = () =>
  [...document.querySelectorAll<HTMLInputElement>("table input")].map((input) => input.value);

describe("ImportScansDialog preview", () => {
  it("ignores a late preview for a file set that is no longer chosen", async () => {
    vi.spyOn(http, "get").mockResolvedValue({ data: [] });
    let resolveA!: (value: unknown) => void;
    vi.spyOn(http, "post").mockReturnValue(new Promise((resolve) => (resolveA = resolve)));
    const wrapper = mount(ImportScansDialog, {
      props: { open: true, job },
      attachTo: document.body,
      global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
    });
    await flushPromises();

    pickFiles("a.jpg");
    await flushPromises();
    [...document.querySelectorAll("button")]
      .find((button) => button.textContent?.includes("Preview"))!
      .click();
    await flushPromises();
    pickFiles("b.jpg");
    await flushPromises();
    resolveA({ data: [{ fileName: "a.jpg", frameNumber: 7 }] });
    await flushPromises();

    expect(frameInputs()).toEqual([""]);
    wrapper.unmount();
  });
});
