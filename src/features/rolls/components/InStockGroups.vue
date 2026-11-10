<script setup lang="ts">
import {
  FILM_TYPE_LABELS,
  PROCESS_LABELS,
  PROCESS_TONE,
  TYPE_TONE,
  type FilmStock,
} from "#/features/film-stocks";
import { h } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import { PRIMARY_TEXT, numberCell, stackCell, tagCell } from "#/shared/components/tableCells";
import { plainText } from "#/shared/lib/format";
import { formatExpiry } from "../format";
import { STOCK_FILTER_VALUES, formatCounts, groupSummary, type StockGroup } from "../rollList";

type GroupRow = StockGroup & { stock: FilmStock | undefined };

defineProps<{ groups: GroupRow[] }>();
const filters = defineModel<Record<string, string>>("filters", { required: true });
const emit = defineEmits<{ open: [stockId: string] }>();

const columns: DataTableColumn<GroupRow>[] = [
  {
    id: "stock",
    header: "Stock",
    accessorFn: (row) => row.stockName,
    cell: ({ row: { original: row } }) =>
      stackCell(
        h("span", { class: PRIMARY_TEXT }, row.stockName),
        row.stock && plainText(row.stock.description),
      ),
  },
  {
    id: "type",
    header: "Type",
    accessorFn: (row) => STOCK_FILTER_VALUES.type(row.stock),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    meta: { filter: { label: "Type", placeholder: "All types" } },
    cell: ({ row: { original: row } }) =>
      row.stock ? tagCell(FILM_TYPE_LABELS[row.stock.type], TYPE_TONE[row.stock.type]) : null,
  },
  {
    id: "process",
    header: "Process",
    accessorFn: (row) => STOCK_FILTER_VALUES.process(row.stock),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    meta: { filter: { label: "Process", placeholder: "All processes" } },
    cell: ({ row: { original: row } }) =>
      row.stock
        ? tagCell(PROCESS_LABELS[row.stock.process], PROCESS_TONE[row.stock.process])
        : null,
  },
  {
    id: "iso",
    header: "ISO",
    accessorFn: (row) => STOCK_FILTER_VALUES.iso(row.stock),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    meta: { filter: { label: "ISO", placeholder: "Any ISO" } },
    cell: ({ row }) => numberCell(row.original.stock?.boxIso),
  },
  {
    id: "formats",
    header: "Rolls per format",
    enableSorting: false,
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex flex-wrap gap-1.5" },
        formatCounts(row.original).map((label) => tagCell(label)),
      ),
  },
  {
    id: "expiry",
    header: "Soonest expiry",
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => numberCell(row.original.soonest && formatExpiry(row.original.soonest)),
  },
];
</script>

<template>
  <DataTable
    v-model:column-filters="filters"
    filter-label="Stock"
    filter-placeholder="Search by stock name..."
    empty-title="No rolls in stock"
    empty-text="No unused rolls on hand."
    :columns="columns"
    :data="groups"
    :get-row-id="(row) => row.stockId"
    :on-select="(row) => emit('open', row.stockId)"
    :row-label="(row) => `Show rolls: ${groupSummary(row)}`"
  />
</template>
