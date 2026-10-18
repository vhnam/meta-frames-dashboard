// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import CameraDetailPage from "./CameraDetailPage.vue";

installFakeServer();

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@tanstack/vue-router", async (original) => ({
  ...(await original<typeof import("@tanstack/vue-router")>()),
  useRouter: () => ({ navigate: vi.fn() }),
}));

const Link = { name: "Link", template: "<a><slot /></a>" };
const render = (cameraId: string) =>
  mount(CameraDetailPage, {
    props: { cameraId },
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Link } },
  });

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("CameraDetailPage", () => {
  it("shows the camera's attributes, built-in lens and roll counts", async () => {
    const camera = server.addCamera(
      { brand: "Olympus", model: "XA" },
      { brand: "Zuiko", model: "", focalLength: 35, maxAperture: 2.8 },
    );
    const stock = server.addStock({ brand: "Kodak", name: "Portra 400" });
    server.addRoll({ filmStockId: stock.id, cameraId: camera.id, status: "in_camera" });
    server.addRoll({ filmStockId: stock.id, cameraId: camera.id, status: "developed" });

    const wrapper = render(camera.id);
    await vi.waitFor(() => expect(wrapper.find("h1").text()).toBe("Olympus XA"));
    const text = wrapper.text().replace(/\s+/g, " ");
    expect(text).toContain("Fixed lens");
    expect(text).toContain("Built-in lens");
    expect(text).toContain("Zuiko 35mm f/2.8");
    await vi.waitFor(() => expect(wrapper.text()).toContain("Rolls (2)"));
    const stats = Object.fromEntries(
      wrapper
        .find("dl")
        .findAll("dt")
        .map((dt) => [dt.text(), dt.element.nextElementSibling?.textContent?.trim()]),
    );
    expect(stats).toMatchObject({ Loaded: "Kodak Portra 400", Lens: "1", Shot: "1" });
  });
});
