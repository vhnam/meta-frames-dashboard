// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import ExpiryView from "#/features/rolls/pages/ExpiryPage.vue";
import InventoryView from "#/features/film-stocks/pages/InventoryPage.vue";
import LabsView from "#/features/labs/pages/LabListPage.vue";
import RollsView from "#/features/rolls/pages/RollListPage.vue";
import StocksView from "#/features/film-stocks/pages/StockListPage.vue";

installFakeServer();

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const Link = { name: "Link", template: "<a><slot /></a>" };
const render = (view: object) =>
  mount(view, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Link } },
  });

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

const views = [
  ["Rolls", RollsView, "No rolls"],
  ["Film stocks", StocksView, "No film stocks yet."],
  ["Inventory", InventoryView, "No unused rolls on hand."],
  ["Expiry", ExpiryView, "Nothing expires soon."],
  ["Labs", LabsView, "No labs yet."],
] as const;

describe("Film & Lab screens", () => {
  it.each(views)("%s shows its empty message", async (_name, view, text) => {
    const wrapper = render(view);
    await vi.waitFor(() => expect(wrapper.text()).toContain(text));
  });

  it("lists stocks and filters by search", async () => {
    server.addStock({ brand: "Kodak", name: "UltraMax" });
    server.addLab({ name: "Saigon Lab" });
    const stocks = render(StocksView);
    await vi.waitFor(() => expect(stocks.findAll("tbody tr")).toHaveLength(1));
    await stocks.find("input").setValue("zzz");
    await stocks.find('form[role="search"]').trigger("submit");
    await vi.waitFor(() => expect(stocks.text()).toContain("No matches"));
    const labs = render(LabsView);
    await vi.waitFor(() => expect(labs.text()).toContain("Saigon Lab"));
  });

  it("rolls open as a list table", async () => {
    const stock = server.addStock({ name: "UltraMax" });
    server.addRoll({ filmStockId: stock.id });
    server.addRoll({ filmStockId: stock.id });
    const wrapper = render(RollsView);
    await vi.waitFor(() => expect(wrapper.text()).toContain("UltraMax"));
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(2));
    expect(wrapper.findAll("button").some((right) => right.text() === "Board view")).toBe(false);
  });

  it("expiry lists in-stock rolls that expire soon, and those without a date", async () => {
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 2);
    server.addRoll({ expiry: { year: soon.getFullYear(), month: soon.getMonth() + 1 } });
    server.addRoll({ expiry: { year: soon.getFullYear() + 5, month: 1 } }); // far away
    server.addRoll({}); // no expiry date
    const wrapper = render(ExpiryView);
    // one table for the dated rolls, one for the roll without a date
    await vi.waitFor(() => expect(wrapper.findAll("table")).toHaveLength(2));
    const [dated, undated] = wrapper.findAll("table");
    expect(dated!.findAll("tbody tr")).toHaveLength(1);
    expect(undated!.findAll("tbody tr")).toHaveLength(1);
    expect(wrapper.find("h2").text().replace(/\s+/g, " ")).toBe("No expiry information (1)");
  });
});
