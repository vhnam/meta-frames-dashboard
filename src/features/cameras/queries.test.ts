// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, h } from "vue";
import { rollKeys } from "#/features/rolls";
import { queryClient } from "#/shared/api/client";
import { http } from "#/shared/api/http";
import { useSetCameraLenses } from "./queries";

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => queryClient.clear());
afterEach(() => vi.restoreAllMocks());

describe("camera lens change", () => {
  it("marks roll details stale, which cache the camera's lenses", async () => {
    vi.spyOn(http, "put").mockResolvedValue({ data: undefined });
    const rollDetail = rollKeys.detail("roll-1");
    queryClient.setQueryData(rollDetail, null);
    let setLenses!: ReturnType<typeof useSetCameraLenses>;
    const wrapper = mount(
      defineComponent({
        setup() {
          setLenses = useSetCameraLenses();
          return () => h("div");
        },
      }),
      { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
    );

    await setLenses.mutateAsync({ cameraId: "camera-1", lensIds: [] });
    expect(queryClient.getQueryState(rollDetail)?.isInvalidated).toBe(true);
    wrapper.unmount();
  });
});
