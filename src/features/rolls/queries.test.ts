// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, h } from "vue";
import { queryClient } from "#/shared/api/client";
import { http } from "#/shared/api/http";
import { rollKeys } from "./api";
import { useSetRollLenses } from "./queries";

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => queryClient.clear());
afterEach(() => vi.restoreAllMocks());

describe("roll lens change", () => {
  it("marks the rolls of a lens page stale", async () => {
    vi.spyOn(http, "put").mockResolvedValue({ data: undefined });
    const lensRolls = rollKeys.list({ lensId: "lens-1" });
    queryClient.setQueryData(lensRolls, []);
    let setLenses!: ReturnType<typeof useSetRollLenses>;
    const wrapper = mount(
      defineComponent({
        setup() {
          setLenses = useSetRollLenses();
          return () => h("div");
        },
      }),
      { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
    );

    await setLenses.mutateAsync({ id: "roll-1", lensIds: [] });
    expect(queryClient.getQueryState(lensRolls)?.isInvalidated).toBe(true);
    wrapper.unmount();
  });
});
