// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import ExpiryView from "./ExpiryView.vue";
import InventoryView from "./InventoryView.vue";
import LabsView from "./LabsView.vue";
import RollsView from "./RollsView.vue";
import StocksView from "./StocksView.vue";

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
    const w = render(view);
    await vi.waitFor(() => expect(w.text()).toContain(text));
  });

  it("lists stocks and filters by search", async () => {
    server.addStock({ brand: "Kodak", name: "UltraMax" });
    server.addLab({ name: "Saigon Lab" });
    const stocks = render(StocksView);
    await vi.waitFor(() => expect(stocks.findAll("tbody tr")).toHaveLength(1));
    await stocks.find("input").setValue("zzz");
    await vi.waitFor(() => expect(stocks.text()).toContain("No matches"));
    const labs = render(LabsView);
    await vi.waitFor(() => expect(labs.text()).toContain("Saigon Lab"));
  });

  it("rolls open as a list table, with a Board toggle", async () => {
    const stock = server.addStock({ name: "UltraMax" });
    server.addRoll({ filmStockId: stock.id });
    server.addRoll({ filmStockId: stock.id });
    const w = render(RollsView);
    await vi.waitFor(() => expect(w.text()).toContain("UltraMax"));
    await vi.waitFor(() => expect(w.findAll("tbody tr")).toHaveLength(2));
    expect(w.findAll("button").some((b) => b.text() === "Board view")).toBe(true);
  });

  it("expiry lists in-stock rolls that expire soon, and those without a date", async () => {
    const soon = new Date();
    soon.setMonth(soon.getMonth() + 2);
    server.addRoll({ expiry: { year: soon.getFullYear(), month: soon.getMonth() + 1 } });
    server.addRoll({ expiry: { year: soon.getFullYear() + 5, month: 1 } }); // far away
    server.addRoll({}); // no expiry date
    const w = render(ExpiryView);
    await vi.waitFor(() => expect(w.findAll("tbody tr")).toHaveLength(1));
    expect(w.text()).toContain("No expiry information (1)");
  });
});
