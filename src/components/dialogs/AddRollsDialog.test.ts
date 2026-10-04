// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import { SelectStub } from "#/test/selectStub";
import AddRollsDialog from "./AddRollsDialog.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("AddRollsDialog", () => {
  it("creates rolls through POST /rolls/bulk", async () => {
    const stock = server.addStock({ name: "ColorPlus 200" });
    const wrapper = mount(AddRollsDialog, {
      attachTo: document.body,
      props: { open: false },
      global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Select: SelectStub } },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    const stockSelect = document.body.querySelector("select") as HTMLSelectElement;
    stockSelect.value = stock.id;
    stockSelect.dispatchEvent(new Event("change"));
    await flushPromises();
    (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(server.rolls).toHaveLength(1));
    wrapper.unmount();
  });
});
