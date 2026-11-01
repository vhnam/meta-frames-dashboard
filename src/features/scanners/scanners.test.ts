// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import { SelectStub } from "#/test/selectStub";
import ScannerFormDialog from "./components/ScannerFormDialog.vue";
import ScannerListPage from "./pages/ScannerListPage.vue";

installFakeServer();
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const plugins = [[VueQueryPlugin, { queryClient }]] as never;

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("Scanners", () => {
  it("lists the built-in scanners next to your own", async () => {
    server.addScanner({ brand: "Sony", model: "A7R IV + Laowa 100mm", kind: "camera" });
    const wrapper = mount(ScannerListPage, {
      global: { plugins, stubs: { Link: { template: "<a><slot /></a>" } } },
    });
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(3));
    const rows = wrapper.findAll("tbody tr").map((row) => row.text());
    expect(rows[0]).toContain("Frontier SP-3000");
    expect(rows[0]).toContain("Built-in");
    expect(rows[2]).toContain("Sony A7R IV + Laowa 100mm");
    expect(rows[2]).toContain("Camera scan");
    expect(rows[2]).toContain("Yours");
  });

  it("opens your scanner to edit and a built-in one to view", async () => {
    server.addScanner({ brand: "Epson", model: "V850" });
    const wrapper = mount(ScannerListPage, {
      attachTo: document.body,
      global: { plugins, stubs: { Link: { template: "<a><slot /></a>" }, Select: SelectStub } },
    });
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(3));
    const rowNamed = (name: string) =>
      wrapper.findAll("tbody tr").find((row) => row.text().includes(name))!;

    await rowNamed("Epson V850").trigger("click");
    await flushPromises();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Edit Scanner"));
    expect(document.body.querySelector("[role=dialog] button[type=submit]")?.textContent).toContain(
      "Save changes",
    );
    (document.body.querySelector("[role=dialog] button[type=button]") as HTMLButtonElement).click();
    await flushPromises();

    await rowNamed("Noritsu HS-1800").trigger("click");
    await flushPromises();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Built-in Scanner"));
    expect(document.body.querySelector("[role=dialog] button[type=submit]")).toBeNull();
    const brand = document.body.querySelector(`[name='["brand"]']`) as HTMLInputElement;
    expect(brand.value).toBe("Noritsu");
    expect(brand.disabled).toBe(true);
    expect(document.body.textContent).not.toContain("Delete");
    wrapper.unmount();
  });

  it("adds a scanner of your own", async () => {
    const wrapper = mount(ScannerFormDialog, {
      attachTo: document.body,
      props: { open: false },
      global: { plugins, stubs: { Select: SelectStub } },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    const field = (name: string) =>
      document.body.querySelector(`[name='["${name}"]']`) as HTMLInputElement;
    field("brand").value = " Epson ";
    field("brand").dispatchEvent(new Event("input"));
    field("model").value = "V850";
    field("model").dispatchEvent(new Event("input"));
    await flushPromises();
    (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(wrapper.emitted("saved")).toBeDefined());
    const posted = server.requests.find(
      (request) => request.method === "post" && request.url === "/scanners",
    );
    // a scanner of unknown kind gets the options of that entry, with their defaults
    expect(posted?.body).toEqual({
      brand: "Epson",
      model: "V850",
      defaultSettings: { resolution: "standard" },
    });
    wrapper.unmount();
  });

  it("needs a brand but not a model", async () => {
    const wrapper = mount(ScannerFormDialog, {
      attachTo: document.body,
      props: { open: false },
      global: { plugins, stubs: { Select: SelectStub } },
    });
    await wrapper.setProps({ open: true } as never);
    await flushPromises();
    const submit = () =>
      (document.body.querySelector("button[type=submit]") as HTMLButtonElement).click();
    submit();
    await vi.waitFor(() => expect(document.body.textContent).toContain("Brand is required."));
    const brand = document.body.querySelector(`[name='["brand"]']`) as HTMLInputElement;
    brand.value = "Noritsu";
    brand.dispatchEvent(new Event("input"));
    await flushPromises();
    submit();
    await vi.waitFor(() => expect(wrapper.emitted("saved")).toBeDefined());
    const posted = server.requests.find(
      (request) => request.method === "post" && request.url === "/scanners",
    );
    expect(posted?.body).toMatchObject({ brand: "Noritsu" });
    expect(posted!.body).not.toHaveProperty("model");
    wrapper.unmount();
  });
});
