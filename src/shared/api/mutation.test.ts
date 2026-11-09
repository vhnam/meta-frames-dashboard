// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, h } from "vue";
import { auditKeys } from "#/features/audit/api";
import { queryClient } from "./client";
import { useApiMutation } from "./mutation";

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => queryClient.clear());

describe("audit log after a write", () => {
  it("goes stale after a write that invalidates data, not after a no-op", async () => {
    queryClient.setQueryData(auditKeys.list(), []);
    let write!: ReturnType<typeof useApiMutation<void>>;
    let preview!: ReturnType<typeof useApiMutation<void>>;
    const wrapper = mount(
      defineComponent({
        setup() {
          write = useApiMutation({ fn: () => {}, invalidates: () => [["rolls"]] });
          preview = useApiMutation({ fn: () => {}, invalidates: () => [] });
          return () => h("div");
        },
      }),
      { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
    );

    await preview.mutateAsync();
    expect(queryClient.getQueryState(auditKeys.list())?.isInvalidated).toBe(false);
    await write.mutateAsync();
    expect(queryClient.getQueryState(auditKeys.list())?.isInvalidated).toBe(true);
    wrapper.unmount();
  });
});
