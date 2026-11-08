// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { http } from "#/shared/api/http";
import type { RollJob } from "#/features/rolls";
import CompareScansDialog from "./CompareScansDialog.vue";

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const job = { id: "job-1", scanOrders: [] } as unknown as RollJob;

beforeEach(() => queryClient.clear());
afterEach(() => vi.restoreAllMocks());

describe("CompareScansDialog", () => {
  it("asks for the frame typed in the number field", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({
      data: { frameNumber: 2, scans: [], missing: [], previousFrameNumber: 1 },
    });
    const wrapper = mount(CompareScansDialog, {
      props: { open: true, job },
      attachTo: document.body,
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await flushPromises();
    const input = document.querySelector<HTMLInputElement>("#compare-frame")!;
    // typing into a number input hands the model a number, not a string
    input.value = "2";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();
    document
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushPromises();
    await vi.waitFor(() => expect(get).toHaveBeenCalledWith("/processing/job-1/frames/2/compare"));
    wrapper.unmount();
  });
});
