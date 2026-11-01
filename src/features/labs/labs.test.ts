// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import LabFormDialog from "./components/LabFormDialog.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const plugins = [[VueQueryPlugin, { queryClient }]] as never;
const FRONTIER = "e2bf4cbd-87a8-4a17-8340-516b1a1cc6bc";

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("Labs", () => {
  it("saves the scanners a lab runs, the default first", async () => {
    const noritsu = server.addScanner({ brand: "Noritsu", model: "", kind: "minilab" });
    const wrapper = mount(LabFormDialog, {
      attachTo: document.body,
      props: { open: false },
      global: { plugins },
    });
    await wrapper.setProps({ open: true } as never);
    await vi.waitFor(() => expect(document.body.textContent).toContain("Frontier SP-3000"));
    const name = document.body.querySelector(`[name='["name"]']`) as HTMLInputElement;
    name.value = "Other Lab";
    name.dispatchEvent(new Event("input"));

    const rowOf = (text: string) =>
      [...document.body.querySelectorAll("fieldset > div")].find(
        (row) => row.querySelector("label .truncate")?.textContent?.trim() === text,
      )!;
    const tick = async (text: string) => {
      (rowOf(text).querySelector("[role=checkbox]") as HTMLButtonElement).click();
      await flushPromises();
    };
    await tick("Frontier SP-3000");
    await tick("Noritsu");
    expect(rowOf("Frontier SP-3000").textContent).toContain("Default");
    // the lab's own Noritsu becomes the default
    (
      [...rowOf("Noritsu").querySelectorAll("button")].find((button) =>
        button.textContent?.includes("Make default"),
      ) as HTMLButtonElement
    ).click();
    await flushPromises();

    (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(wrapper.emitted("saved")).toBeDefined());
    const posted = server.requests.find(
      (request) => request.method === "post" && request.url === "/labs",
    );
    expect(posted?.body).toEqual({ name: "Other Lab", scannerIds: [noritsu.id, FRONTIER] });
    wrapper.unmount();
  });
});
