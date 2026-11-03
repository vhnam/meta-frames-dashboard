// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vite-plus/test";
import { Toaster } from "#/shared/ui/sonner";
import { notify } from "./toast";

describe("notify", () => {
  it("shows a Close action that dismisses the toast", async () => {
    const wrapper = mount(Toaster, { attachTo: document.body });
    notify.error("Something went wrong");
    await flushPromises();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Something went wrong"));
    const close = document.body.querySelector("[data-action]") as HTMLButtonElement;
    expect(close.textContent).toBe("Close");
    close.click();
    await vi.waitFor(() =>
      expect(document.body.querySelector("[data-sonner-toast]")?.getAttribute("data-removed")).toBe(
        "true",
      ),
    );
    wrapper.unmount();
  });
});
