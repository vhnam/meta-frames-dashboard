// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { nextTick } from "vue";
import { queryClient } from "#/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import CameraFormDialog from "./CameraFormDialog.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("CameraFormDialog", () => {
  it("fills the form when the camera detail arrives after the dialog opened", async () => {
    const cam = server.addCamera({ brand: "Nikon", model: "S2", mount: "S" });
    const wrapper = mount(CameraFormDialog, {
      attachTo: document.body,
      props: { open: false, cameraId: undefined },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    // the page sets the id and opens the dialog in the same tick; the detail is not cached yet
    await wrapper.setProps({ cameraId: cam.id, open: true } as never);
    await nextTick();
    await vi.waitFor(() => {
      const values = [...document.body.querySelectorAll("input")].map((i) => i.value);
      expect(values).toContain("Nikon");
      expect(values).toContain("S2");
    });
    await flushPromises();
    // every dialog needs a description for screen readers, even when none is shown
    const description = document.body.querySelector('[data-slot="dialog-description"]');
    expect(description?.className).toContain("sr-only");
    wrapper.unmount();
  });
});
