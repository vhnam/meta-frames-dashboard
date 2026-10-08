// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import StockDetailPage from "./StockDetailPage.vue";

installFakeServer();

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@tanstack/vue-router", async (original) => ({
  ...(await original<typeof import("@tanstack/vue-router")>()),
  useRouter: () => ({ navigate: vi.fn() }),
}));

const Link = { name: "Link", template: "<a><slot /></a>" };
const render = (stockId: string) =>
  mount(StockDetailPage, {
    props: { stockId },
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Link } },
  });

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("StockDetailPage", () => {
  it("shows the stock's attributes and roll counts", async () => {
    const base = server.addStock({ brand: "Kodak", name: "Vision3 500T", process: "ECN-2" });
    const stock = server.addStock({
      brand: "CineStill",
      name: "800T",
      boxIso: 800,
      process: "C-41",
      packaging: "repack",
      stockOrigin: "USA",
      baseStockId: base.id,
    });
    server.addRoll({ filmStockId: stock.id, expiry: { year: 2030, month: 4 } });
    server.addRoll({ filmStockId: stock.id, expiry: { year: 2029, month: 2 } });
    server.addRoll({ filmStockId: stock.id, format: 120, exposures: 12 });
    server.addRoll({ filmStockId: stock.id, status: "in_camera" });

    const w = render(stock.id);
    await vi.waitFor(() => expect(w.find("h1").text()).toBe("CineStill 800T"));
    const text = w.text().replace(/\s+/g, " ");
    expect(text).toContain("Box ISO 800");
    expect(text).toContain("Color (C-41)");
    expect(text).toContain("Origin: USA");
    expect(text).toContain("Kodak Vision3 500T");
    // header stats; Next expiry is the earliest among unexposed rolls
    const stats = () =>
      Object.fromEntries(
        w
          .find("dl")
          .findAll("dt")
          .map((dt) => [dt.text(), dt.element.nextElementSibling?.textContent?.trim()]),
      );
    await vi.waitFor(() => expect(stats()).toMatchObject({ Unexposed: "3", Shot: "1" }));
    expect(stats()).toMatchObject({ "Next expiry": "02/2029" });
    expect(w.find("dl").text()).toContain("of 4 rolls");
    // unexposed rolls per format under the count
    expect(w.find("dl").text()).toContain("2 × 135 · 1 × 120");
    expect(w.text()).toContain("No notes yet.");
  });
});
