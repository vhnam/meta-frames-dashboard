// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, h, toRaw } from "vue";
import { queryClient } from "#/shared/api/client";
import { http } from "#/shared/api/http";
import { useImportScans, useScanFile } from "./queries";

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => queryClient.clear());
afterEach(() => vi.restoreAllMocks());

describe("scan images after a replace import", () => {
  it("refetches the image of the scan whose id the server kept", async () => {
    const oldBlob = new Blob(["old"]);
    const newBlob = new Blob(["new"]);
    const get = vi
      .spyOn(http, "get")
      .mockResolvedValueOnce({ data: oldBlob })
      .mockResolvedValueOnce({ data: newBlob });
    vi.spyOn(http, "post").mockResolvedValue({
      data: { imported: [], skipped: [], failed: [] },
    });
    let api!: { file: ReturnType<typeof useScanFile>; imp: ReturnType<typeof useImportScans> };
    const wrapper = mount(
      defineComponent({
        setup() {
          api = { file: useScanFile("scan-1"), imp: useImportScans() };
          return () => h("div");
        },
      }),
      { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
    );
    await flushPromises();
    expect(toRaw(api.file.data.value)).toBe(oldBlob);

    await api.imp.mutateAsync({
      jobId: "job-1",
      scannerId: "sc",
      onConflict: "replace",
      entries: [{ file: new File(["x"], "1.jpg"), frameNumber: 1 }],
    });
    await vi.waitFor(() => expect(toRaw(api.file.data.value)).toBe(newBlob));
    expect(get).toHaveBeenCalledTimes(2);
    // each fetch carries its own cache-buster so the browser HTTP cache is bypassed
    const stamps = get.mock.calls.map((call) => (call[1] as { params: { v: number } }).params.v);
    expect(stamps.every((v) => typeof v === "number")).toBe(true);
    wrapper.unmount();
  });
});
