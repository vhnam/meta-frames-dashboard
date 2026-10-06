<script setup lang="ts" generic="TData extends RowData">
import { FlexRender, useTable, type RowData } from "@tanstack/vue-table";
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconFilter,
  IconFilterFilled,
} from "@tabler/icons-vue";
import { dataTableFeatures, PAGE_SIZES, type DataTableColumn } from "./dataTable";
import { useRouter } from "@tanstack/vue-router";
import { computed, onMounted, ref, toRef, watch } from "vue";
import { parseListSearch, rememberList, toListSearch } from "#/shared/lib/listSearch";
import FilterCard from "./FilterCard.vue";
import SearchField from "./SearchField.vue";
import { Button } from "#/shared/ui/button";
import { Card, CardContent } from "#/shared/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/shared/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "#/shared/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "#/shared/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "#/shared/ui/table";

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
  /** Extra classes on the `<table>` (for example `table-fixed`). */
  tableClass?: string;
  /** Makes each body row activatable. Rows become keyboard-focusable. */
  onSelect?: (row: TData) => void;
  /** `getRowId` value of the row shown as selected. */
  selectedRowId?: string;
  /** Accessible name for an activatable row. */
  rowLabel?: (row: TData) => string;
}>();

const filter = ref("");
const router = useRouter({ warn: false });
const initial = router ? parseListSearch(router.state.location.search) : {};
const pagination = ref({
  pageIndex: Math.max(0, (initial.page ?? 1) - 1),
  pageSize: initial.pageSize ?? PAGE_SIZES[0],
});

function syncListSearch() {
  if (!router) return;
  const page = pagination.value.pageIndex + 1;
  const pageSize = pagination.value.pageSize;
  const path = router.state.location.pathname;
  rememberList(path, page, pageSize);
  const next = toListSearch(page, pageSize);
  const current = parseListSearch(router.state.location.search);
  if (current.page === next.page && current.pageSize === next.pageSize) return;
  void router.navigate({ to: ".", search: next, replace: true });
}

watch(pagination, syncListSearch, { deep: true });
onMounted(syncListSearch);

const table = useTable({
  features: dataTableFeatures,
  columns: props.columns,
  data: toRef(props, "data"),
  getRowId: props.getRowId,
  globalFilterFn: "includesString",
  state: computed(() => ({ globalFilter: filter.value, pagination: pagination.value })),
  onPaginationChange: (next: unknown) => {
    pagination.value = typeof next === "function" ? next(pagination.value) : next;
  },
  onGlobalFilterChange: (next: unknown) => {
    filter.value = String(typeof next === "function" ? next(filter.value) : (next ?? ""));
  },
});

/** A restored page past the end of the list falls back to the last page that has rows. */
watch(
  () => table.getPageCount(),
  (count) => {
    if (count > 0 && pagination.value.pageIndex > count - 1)
      pagination.value = { ...pagination.value, pageIndex: count - 1 };
  },
  { immediate: true },
);

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

const rowCount = computed(() => table.getPrePaginatedRowModel().rows.length);
const rangeStart = computed(() =>
  rowCount.value ? (page.value - 1) * pagination.value.pageSize + 1 : 0,
);
const rangeEnd = computed(() => Math.min(page.value * pagination.value.pageSize, rowCount.value));
const page = computed(() => pagination.value.pageIndex + 1);

function setPageSize(value: unknown) {
  pagination.value = { pageIndex: 0, pageSize: Number(value) };
}

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
  <div class="space-y-4">
    <Card>
      <CardContent>
        <Table :class="tableClass">
          <TableHeader class="bg-muted/60 [&_th]:font-semibold">
            <TableRow v-for="group in table.getHeaderGroups()" :key="group.id">
              <TableHead
                v-for="header in group.headers"
                :key="header.id"
                :class="header.column.columnDef.meta?.class"
              >
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
                        <IconFilterFilled v-if="header.column.getIsFiltered()" class="size-3.5" />
                        <IconFilter v-else class="size-3.5" />
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
              :data-state="
                selectedRowId != null && row.id === selectedRowId ? 'selected' : undefined
              "
              :tabindex="onSelect ? 0 : undefined"
              :aria-label="onSelect ? (rowLabel?.(row.original) ?? 'View details') : undefined"
              :class="[
                rowClass?.(row.original),
                onSelect &&
                  'cursor-pointer focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset',
              ]"
              @click="onSelect?.(row.original)"
              @keydown.enter.prevent="onSelect?.(row.original)"
              @keydown.space.prevent="onSelect?.(row.original)"
            >
              <TableCell
                v-for="cell in row.getAllCells()"
                :key="cell.id"
                :class="cell.column.columnDef.meta?.class"
              >
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
    <div v-if="rowCount > PAGE_SIZES[0]" class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2 text-sm">
        <span>Result per page</span>
        <Select :model-value="String(pagination.pageSize)" @update:model-value="setPageSize">
          <SelectTrigger size="sm" class="w-20" aria-label="Result per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="n in PAGE_SIZES" :key="n" :value="String(n)">{{ n }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-6 text-sm">
        <span>{{ rangeStart }}-{{ rangeEnd }} of {{ rowCount.toLocaleString() }}</span>
        <Pagination
          class="mx-0 w-auto"
          :total="rowCount"
          :items-per-page="pagination.pageSize"
          :page="page"
          @update:page="(p) => table.setPageIndex(p - 1)"
        >
          <PaginationContent v-slot="{ items }">
            <PaginationFirst size="icon" aria-label="First page">
              <IconChevronsLeft class="size-4" />
            </PaginationFirst>
            <PaginationPrevious size="icon" aria-label="Previous page">
              <IconChevronLeft class="size-4" />
            </PaginationPrevious>
            <template v-for="(item, i) in items" :key="i">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === page"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :index="i" />
            </template>
            <PaginationNext size="icon" aria-label="Next page">
              <IconChevronRight class="size-4" />
            </PaginationNext>
            <PaginationLast size="icon" aria-label="Last page">
              <IconChevronsRight class="size-4" />
            </PaginationLast>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  </div>
</template>
