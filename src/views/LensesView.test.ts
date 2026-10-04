// @vitest-environment happy-dom
import { VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { queryClient } from "#/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import { tableOf } from "#/test/tableOf";
import DataTable from "#/components/common/DataTable.vue";
import LensesView from "./LensesView.vue";

installFakeServer();

vi.mock("vue-sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("LensesView mount filter", () => {
  it("offers Built-in and filters to built-in lenses", async () => {
    server.addCamera({ hasFixedLens: true });
    server.addLens();
    const wrapper = mount(LensesView, {
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(2));
    const table = tableOf(wrapper.findComponent(DataTable));
    const mountColumn = table.getColumn("mount")!;
    expect([...mountColumn.getFacetedUniqueValues().keys()]).toContain("Built-in");
    mountColumn.setFilterValue("Built-in");
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(1));
    expect(wrapper.find("tbody").text()).toContain("Built-in");
  });

  it("hides Built-in when no fixed-lens camera exists", async () => {
    server.addLens();
    const wrapper = mount(LensesView, {
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    });
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(1));
    const table = tableOf(wrapper.findComponent(DataTable));
    expect([...table.getColumn("mount")!.getFacetedUniqueValues().keys()]).toEqual(["FD"]);
  });
});
