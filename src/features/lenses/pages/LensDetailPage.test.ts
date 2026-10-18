// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import LensDetailPage from "./LensDetailPage.vue";

installFakeServer();

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@tanstack/vue-router", async (original) => ({
  ...(await original<typeof import("@tanstack/vue-router")>()),
  useRouter: () => ({ navigate: vi.fn() }),
}));

const Link = { name: "Link", template: "<a><slot /></a>" };
const render = (lensId: string) =>
  mount(LensDetailPage, {
    props: { lensId },
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Link } },
  });

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("LensDetailPage", () => {
  it("shows the lens's optics and the rolls shot with it", async () => {
    const lens = server.addLens({ brand: "Canon", model: "FD", focalLength: 50, maxAperture: 1.4 });
    const other = server.addLens();
    const stock = server.addStock({ brand: "Ilford", name: "HP5" });
    server.addRoll({ filmStockId: stock.id, status: "developed", lensIds: [lens.id] });
    server.addRoll({ filmStockId: stock.id, status: "developed", lensIds: [other.id] });

    const wrapper = render(lens.id);
    await vi.waitFor(() => expect(wrapper.find("h1").text()).toBe("Canon FD 50mm f/1.4"));
    const text = wrapper.text().replace(/\s+/g, " ");
    expect(text).toContain("Mount: FD");
    expect(text).toContain("Delete");
    await vi.waitFor(() => expect(wrapper.text()).toContain("Rolls (1)"));
    expect(wrapper.text()).toContain("Ilford HP5");
  });

  it("links a built-in lens to its camera and hides Delete", async () => {
    const camera = server.addCamera({ brand: "Olympus", model: "XA", hasFixedLens: true });
    const wrapper = render(camera.builtInLensId!);
    await vi.waitFor(() => expect(wrapper.text()).toContain("Built into"));
    expect(wrapper.text()).toContain("Olympus XA");
    expect(wrapper.text()).not.toContain("Delete");
  });

  it("says when the lens does not exist", async () => {
    const wrapper = render("missing");
    await vi.waitFor(() => expect(wrapper.text()).toContain("Lens not found."));
  });
});
