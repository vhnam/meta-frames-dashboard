// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { AxiosError, type AxiosAdapter } from "axios";
import { queryClient } from "#/shared/api/client";
import { http } from "#/shared/api/http";
import { installFakeServer, server } from "#/test/fakeServer";
import LabsView from "#/features/labs/pages/LabListPage.vue";
import RollsView from "#/features/rolls/pages/RollListPage.vue";
import StocksView from "#/features/film-stocks/pages/StockListPage.vue";

installFakeServer();

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const Link = { name: "Link", template: "<a><slot /></a>" };
const render = (view: object, props: Record<string, unknown> = {}) =>
  mount(view, {
    props,
    global: { plugins: [[VueQueryPlugin, { queryClient }]], stubs: { Link } },
  });

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

const views = [
  ["Rolls", RollsView, "No rolls"],
  ["Film stocks", StocksView, "No film stocks yet."],
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

  it("lets a finished roll be picked for Hand to lab", async () => {
    const stock = server.addStock({ name: "UltraMax" });
    server.addRoll({ filmStockId: stock.id, status: "done_shooting" });
    const wrapper = render(RollsView, { search: { tab: "done_shooting" } });
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(1));
    const handOver = () =>
      wrapper.findAll("button").find((button) => button.text().startsWith("Hand to lab"))!;
    expect(handOver().attributes("disabled")).toBeDefined();
    await wrapper.find('tbody [role="checkbox"]').trigger("click");
    await vi.waitFor(() => expect(handOver().attributes("disabled")).toBeUndefined());
    expect(handOver().text()).toContain("(1)");
  });

  it("hands over only the picked rolls the table still shows", async () => {
    const ultramax = server.addStock({ name: "UltraMax" });
    const gold = server.addStock({ name: "Gold" });
    server.addRoll({ filmStockId: ultramax.id, status: "done_shooting" });
    server.addRoll({ filmStockId: gold.id, status: "done_shooting" });
    const wrapper = render(RollsView, { search: { tab: "done_shooting" } });
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(2));
    const handOver = () =>
      wrapper.findAll("button").find((button) => button.text().startsWith("Hand to lab"))!;
    const ultramaxRow = wrapper.findAll("tbody tr").find((tr) => tr.text().includes("UltraMax"))!;
    await ultramaxRow.find('[role="checkbox"]').trigger("click");
    await vi.waitFor(() => expect(handOver().text()).toContain("(1)"));
    // search hides UltraMax, then Gold is picked too: only Gold is still shown
    await wrapper.find('form[role="search"] input').setValue("Gold");
    await wrapper.find('form[role="search"]').trigger("submit");
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(1));
    await wrapper.find('tbody [role="checkbox"]').trigger("click");
    await vi.waitFor(() => expect(handOver().text()).toContain("(1)"));
    expect(handOver().text()).not.toContain("(2)");
  });

  it("drops picks a filter hides, so they free their place in the batch", async () => {
    const ultramax = server.addStock({ name: "UltraMax" });
    const gold = server.addStock({ name: "Gold" });
    server.addRoll({ filmStockId: ultramax.id, status: "done_shooting" });
    server.addRoll({ filmStockId: gold.id, status: "done_shooting" });
    const wrapper = render(RollsView, { search: { tab: "done_shooting" } });
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(2));
    const handOver = () =>
      wrapper.findAll("button").find((button) => button.text().startsWith("Hand to lab"))!;
    const ultramaxRow = wrapper.findAll("tbody tr").find((tr) => tr.text().includes("UltraMax"))!;
    await ultramaxRow.find('[role="checkbox"]').trigger("click");
    const search = async (text: string) => {
      await wrapper.find('form[role="search"] input').setValue(text);
      await wrapper.find('form[role="search"]').trigger("submit");
    };
    await search("Gold");
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(1));
    await wrapper.find('tbody [role="checkbox"]').trigger("click");
    // back to every roll: the hidden UltraMax pick was dropped when Gold was picked
    await search("");
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(2));
    expect(handOver().text()).toContain("(1)");
  });

  it("in stock lists rolls by expiry and flags expired ones", async () => {
    const stock = server.addStock({ name: "UltraMax" });
    server.addRoll({ filmStockId: stock.id }); // no expiry date
    server.addRoll({ filmStockId: stock.id, expiry: { year: 2020, month: 1 } });
    const far = server.addRoll({ filmStockId: stock.id, expiry: { year: 2099 } });
    const wrapper = render(RollsView, { search: { tab: "in_stock" } });
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(3));
    const cells = wrapper.findAll("tbody tr").map((tr) => tr.text());
    expect(cells[0]).toContain("Expired");
    expect(cells[1]).toContain("2099");
    expect(cells[2]).not.toContain("Expired");
    expect(far.id).toBeTruthy();
  });

  it("groups in stock rolls by stock and opens a group", async () => {
    const stock = server.addStock({ brand: "ORWO", name: "NC500" });
    server.addRoll({ filmStockId: stock.id, expiry: { year: 2099, month: 12 } });
    server.addRoll({ filmStockId: stock.id, format: 120 });
    server.addRoll({ filmStockId: stock.id, status: "in_camera" });
    const grouped = render(RollsView, { search: { tab: "in_stock", group: "stock" } });
    await vi.waitFor(() => expect(grouped.findAll("tbody tr")).toHaveLength(1));
    expect(grouped.find("tbody tr").attributes("aria-label")).toBe(
      "Show rolls: ORWO NC500 · 1 × 135 · 1 × 120 · 12/2099",
    );
    const opened = render(RollsView, {
      search: { tab: "in_stock", group: "stock", stock: stock.id },
    });
    await vi.waitFor(() => expect(opened.findAll("tbody tr")).toHaveLength(2));
  });

  it("shows a stock list error in the group view, not an empty stock", async () => {
    server.addRoll({});
    const fake = http.defaults.adapter as AxiosAdapter;
    http.defaults.adapter = (config) =>
      config.url === "/film-stocks"
        ? Promise.reject(new AxiosError("HTTP 500", "ERR_BAD_RESPONSE", config))
        : fake(config);
    try {
      const wrapper = render(RollsView, { search: { tab: "in_stock", group: "stock" } });
      // one retry first (the query client retries once)
      await vi.waitFor(() => expect(wrapper.text()).toContain("Couldn't load this data."), {
        timeout: 4000,
      });
      expect(wrapper.text()).not.toContain("No unused rolls on hand.");
      expect(wrapper.findAll("button").some((button) => button.text() === "Retry")).toBe(true);
    } finally {
      http.defaults.adapter = fake;
    }
  });

  it("an open group bookmark follows the stock filters after the stock changes", async () => {
    // bookmarked as ISO 400; the stock's box ISO is now 800
    const stock = server.addStock({ name: "Portra", boxIso: "800" });
    server.addRoll({ filmStockId: stock.id });
    const open = { tab: "in_stock", group: "stock", stock: stock.id } as const;
    const stale = render(RollsView, { search: { ...open, iso: "400" } });
    await vi.waitFor(() => expect(stale.text()).toContain("No matching rolls"));
    expect(stale.findAll("tbody tr").filter((row) => row.attributes("aria-label"))).toHaveLength(0);
    expect(stale.findAll("button").some((button) => button.text() === "All stocks")).toBe(true);
    const current = render(RollsView, { search: { ...open, iso: "800" } });
    await vi.waitFor(() =>
      expect(
        current.findAll("tbody tr").filter((row) => row.attributes("aria-label")),
      ).toHaveLength(1),
    );
  });
});
