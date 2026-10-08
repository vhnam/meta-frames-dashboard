// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vite-plus/test";
import { tableOf } from "#/test/tableOf";
import DataTable from "./DataTable.vue";
import type { DataTableColumn } from "./dataTable";

interface Row {
  name: string;
  n: number;
}
const columns: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", accessorFn: (r) => r.name, cell: ({ row }) => row.original.name },
  { id: "n", header: "N", cell: ({ row }) => row.original.n },
];
const data: Row[] = [
  { name: "b", n: 1 },
  { name: "a", n: 2 },
];

describe("DataTable", () => {
  it("sorts on header click and leaves columns without an accessor unsortable", async () => {
    const wrapper = mount(DataTable, { props: { columns, data } as never });
    const names = () => wrapper.findAll("tbody tr").map((r) => r.find("td").text());
    expect(names()).toEqual(["b", "a"]);
    expect(wrapper.findAll("thead button")).toHaveLength(1);

    await wrapper.find("thead button").trigger("click");
    expect(names()).toEqual(["a", "b"]);
    await wrapper.find("thead button").trigger("click");
    expect(names()).toEqual(["b", "a"]);
  });

  /** Types into the search box and presses Apply (submits the search form). */
  async function search(wrapper: ReturnType<typeof mount>, text: string) {
    await wrapper.find("input").setValue(text);
    await wrapper.find('form[role="search"]').trigger("submit");
  }

  it("filters rows by the search box once applied", async () => {
    const wrapper = mount(DataTable, { props: { columns, data } as never });
    await wrapper.find("input").setValue("a");
    expect(wrapper.findAll("tbody tr")).toHaveLength(2); // not applied yet
    await wrapper.find('form[role="search"]').trigger("submit");
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(1));
    expect(wrapper.find("tbody").text()).toContain("a");
    await search(wrapper, "zzz");
    await vi.waitFor(() => expect(wrapper.find("tbody").text()).toContain("No matches"));
  });

  const kindColumn: DataTableColumn<Row> = {
    id: "kind",
    header: "Kind",
    accessorFn: (r) => (r.n > 1 ? "big" : "small"),
    filterFn: "equalsString",
    meta: { filter: { label: "Kind", placeholder: "Any kind" } },
    cell: ({ row }) => (row.original.n > 1 ? "big" : "small"),
  };

  it("filters rows with a column filter and shows a header filter button", async () => {
    const wrapper = mount(DataTable, {
      props: { columns: [...columns.slice(0, 1), kindColumn], data } as never,
    });
    expect(wrapper.find('thead button[aria-label="Filter Kind"]').exists()).toBe(true);
    const column = tableOf(wrapper).getColumn("kind")!;
    expect(
      [...column.getFacetedUniqueValues().keys()].sort((a, b) =>
        String(a).localeCompare(String(b)),
      ),
    ).toEqual(["big", "small"]);
    column.setFilterValue("big");
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(1));
    expect(wrapper.find("tbody td").text()).toBe("a");
  });

  it("marks the search Applied until the keyword changes, and X clears it", async () => {
    const wrapper = mount(DataTable, { props: { columns, data } as never });
    const apply = () => wrapper.find('button[type="submit"]');
    const clear = () => wrapper.find('button[aria-label="Clear search"]');
    expect(apply().text()).toBe("Apply");
    expect(clear().exists()).toBe(false);

    await search(wrapper, "a");
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(1));
    expect(apply().text()).toBe("Applied");
    expect(apply().attributes("disabled")).toBeDefined();

    await wrapper.find("input").setValue("b");
    expect(apply().text()).toBe("Apply");
    expect(apply().attributes("disabled")).toBeUndefined();

    await clear().trigger("click");
    await vi.waitFor(() => expect(wrapper.findAll("tbody tr")).toHaveLength(2));
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("");
    expect(clear().exists()).toBe(false);
    expect(apply().text()).toBe("Apply");
  });

  it("searches only columns that allow global filtering", async () => {
    const cols: DataTableColumn<Row>[] = [
      {
        id: "name",
        header: "Name",
        accessorFn: (r) => r.name,
        cell: ({ row }) => row.original.name,
      },
      {
        id: "n",
        header: "N",
        accessorFn: (r) => r.n,
        enableGlobalFilter: false,
        filterFn: (row, id, v) => String(row.getValue(id)) === String(v),
        cell: ({ row }) => row.original.n,
      },
    ];
    const wrapper = mount(DataTable, { props: { columns: cols, data } as never });
    await search(wrapper, "2"); // matches n, which is not searchable
    await vi.waitFor(() => expect(wrapper.find("tbody").text()).toContain("No matches"));
  });

  it("lists fixed filter options even when no row has them", async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: [
          ...columns.slice(0, 1),
          {
            ...kindColumn,
            meta: { filter: { label: "Kind", placeholder: "Any kind", options: ["big", "huge"] } },
          },
        ],
        data,
      } as never,
      attachTo: document.body,
    });
    await wrapper
      .find('thead button[aria-label="Filter Kind"]')
      .trigger("keydown", { key: "Enter" });
    await vi.waitFor(() =>
      expect(
        [...document.querySelectorAll('[role="menuitemradio"]')].map((e) => e.textContent?.trim()),
      ).toEqual(["Any kind", "big", "huge"]),
    );
    wrapper.unmount();
  });

  it("keeps headers and shows the empty text when there is no data", () => {
    const wrapper = mount(DataTable, {
      props: { columns, data: [], emptyText: "No rows yet." } as never,
    });
    expect(wrapper.find("thead").text()).toContain("Name");
    expect(wrapper.find("tbody").text()).toContain("No rows yet.");
  });

  it("paginates 10 rows per page by default", async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ name: `r${i}`, n: i }));
    const wrapper = mount(DataTable, { props: { columns, data: many } as never });
    expect(wrapper.findAll("tbody tr")).toHaveLength(10);
    await wrapper.find('[data-slot="pagination-next"]').trigger("click");
    expect(wrapper.find("tbody td").text()).toBe("r10");
  });

  it("activates a row from click and keyboard when onSelect is set", async () => {
    const onSelect = vi.fn();
    const wrapper = mount(DataTable, {
      props: { columns, data, onSelect, selectedRowId: "0", rowLabel: (r: Row) => r.name } as never,
    });
    const row = wrapper.find("tbody tr");
    expect(row.attributes("tabindex")).toBe("0");
    expect(row.attributes("aria-label")).toBe("b");
    expect(row.attributes("data-state")).toBe("selected");
    await row.trigger("click");
    expect(onSelect).toHaveBeenCalledWith(data[0]);
    await row.trigger("keydown", { key: "Enter" });
    await row.trigger("keydown", { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it("shows the pager footer with the row range, and hides it without rows", () => {
    const wrapper = mount(DataTable, { props: { columns, data } as never });
    expect(wrapper.find('[data-slot="pagination"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("1-2 of 2");
    const empty = mount(DataTable, { props: { columns, data: [] } as never });
    expect(empty.find('[data-slot="pagination"]').exists()).toBe(false);
  });
});
