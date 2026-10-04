<script setup lang="ts" generic="TData extends RowData">
import { FlexRender, useTable, type RowData } from "@tanstack/vue-table";
import { IconArrowDown, IconArrowUp, IconArrowsSort, IconFilter } from "@tabler/icons-vue";
import { dataTableFeatures, type DataTableColumn } from "./dataTable";
import { computed, ref, toRef } from "vue";
import FilterCard from "./FilterCard.vue";
import SearchField from "./SearchField.vue";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "#/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";

const props = defineProps<{
  columns: DataTableColumn<TData>[];
  data: readonly TData[];
  getRowId?: (row: TData) => string;
  rowClass?: (row: TData) => string | undefined;
  filterPlaceholder?: string;
  filterLabel?: string;
  /** Title shown when there is no data at all. */
  emptyTitle?: string;
  /** Description shown when there is no data at all (as opposed to no filter matches). */
  emptyText?: string;
  /** Hide the built-in search and dropdown filters (the page supplies its own). */
  hideFilters?: boolean;
}>();

const filter = ref("");

const table = useTable({
  features: dataTableFeatures,
  columns: props.columns,
  data: toRef(props, "data"),
  getRowId: props.getRowId,
  globalFilterFn: "includesString",
  state: computed(() => ({ globalFilter: filter.value })),
  onGlobalFilterChange: (next: unknown) => {
    filter.value = String(typeof next === "function" ? next(filter.value) : (next ?? ""));
  },
});

/** Columns that declare `meta.filter` get a dropdown backed by their TanStack column filter. */
const filterColumns = computed(() =>
  table.getAllLeafColumns().filter((c) => c.columnDef.meta?.filter),
);

function optionsOf(column: (typeof filterColumns.value)[number]) {
  const format = column.columnDef.meta?.filter?.format;
  return [...column.getFacetedUniqueValues().keys()]
    .map(String)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((value) => ({ value, label: format?.(value) ?? value }));
}

const isFiltered = computed(
  () => filter.value !== "" || table.getAllLeafColumns().some((c) => c.getIsFiltered()),
);

function reset() {
  filter.value = "";
  table.resetColumnFilters(true);
}

const ALL = "__all__";
const selected = (column: (typeof filterColumns.value)[number]) =>
  String(column.getFilterValue() ?? ALL);

const select = (column: (typeof filterColumns.value)[number], value: string) =>
  column.setFilterValue(value === ALL ? undefined : value);

defineExpose({ table });
</script>

<template>
  <FilterCard v-if="!hideFilters">
    <SearchField
      v-model="filter"
      :label="filterLabel ?? 'Search'"
      :placeholder="filterPlaceholder"
    />
    <Button type="button" variant="outline" :disabled="!isFiltered" @click="reset">Reset</Button>
  </FilterCard>
  <Card>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow v-for="group in table.getHeaderGroups()" :key="group.id">
            <TableHead v-for="header in group.headers" :key="header.id">
              <div v-if="!header.isPlaceholder" class="flex items-center gap-1">
                <button
                  v-if="header.column.getCanSort()"
                  type="button"
                  class="inline-flex items-center gap-1 hover:text-foreground"
                  @click="header.column.getToggleSortingHandler()?.($event)"
                >
                  <FlexRender :header="header" />
                  <IconArrowUp v-if="header.column.getIsSorted() === 'asc'" class="size-3.5" />
                  <IconArrowDown
                    v-else-if="header.column.getIsSorted() === 'desc'"
                    class="size-3.5"
                  />
                  <IconArrowsSort v-else class="size-3.5 opacity-40" />
                </button>
                <FlexRender v-else :header="header" />
                <DropdownMenu v-if="header.column.columnDef.meta?.filter">
                  <DropdownMenuTrigger as-child>
                    <button
                      type="button"
                      class="hover:bg-accent rounded p-0.5"
                      :class="
                        header.column.getIsFiltered() ? 'text-primary' : 'text-muted-foreground'
                      "
                      :aria-label="`Filter ${header.column.columnDef.meta.filter.label}`"
                    >
                      <IconFilter class="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>{{
                      header.column.columnDef.meta.filter.label
                    }}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup
                      :model-value="selected(header.column)"
                      @update:model-value="(v) => select(header.column, String(v))"
                    >
                      <DropdownMenuRadioItem :value="ALL">
                        {{ header.column.columnDef.meta.filter.placeholder }}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        v-for="o in optionsOf(header.column)"
                        :key="o.value"
                        :value="o.value"
                      >
                        {{ o.label }}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            :class="rowClass?.(row.original)"
          >
            <TableCell v-for="cell in row.getAllCells()" :key="cell.id">
              <FlexRender :cell="cell" />
            </TableCell>
          </TableRow>
          <TableEmpty v-if="!table.getRowModel().rows.length" :colspan="columns.length">
            <Empty class="p-0 md:p-0">
              <EmptyHeader>
                <EmptyTitle>{{
                  data.length ? "No matches" : (emptyTitle ?? "Nothing here yet")
                }}</EmptyTitle>
                <EmptyDescription>
                  {{
                    data.length
                      ? "Try a different search or clear the filters."
                      : (emptyText ?? "Add one to get started.")
                  }}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </TableEmpty>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template>
