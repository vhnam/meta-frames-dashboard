<script setup lang="ts">
import { PROCESS_TONE, TYPE_TONE, stockName } from "../format";
import { useInventory } from "../queries";
import { FILM_TYPE_LABELS, PROCESS_LABELS } from "../types";
import type { InventoryRow } from "../types";
import { Link } from "@tanstack/vue-router";
import { h } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import {
  PRIMARY_LINK,
  mutedCell,
  numberCell,
  stackCell,
  tagCell,
} from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";

const inventory = useInventory({});

const columns: DataTableColumn<InventoryRow>[] = [
  {
    id: "stock",
    header: "Stock",
    accessorFn: (r) => stockName(r.stock),
    cell: ({ row: { original: r } }) =>
      stackCell(
        h(
          Link,
          { to: "/app/stocks/$stockId", params: { stockId: r.stock.id }, class: PRIMARY_LINK },
          () => stockName(r.stock),
        ),
        r.stock.description,
      ),
  },
  {
    id: "type",
    header: "Type",
    accessorFn: (r) => FILM_TYPE_LABELS[r.stock.type],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    meta: { filter: { label: "Type", placeholder: "All types" } },
    cell: ({ row: { original: r } }) =>
      tagCell(FILM_TYPE_LABELS[r.stock.type], TYPE_TONE[r.stock.type]),
  },
  {
    id: "process",
    header: "Process",
    accessorFn: (r) => r.stock.process,
    enableGlobalFilter: false,
    filterFn: "equalsString",
    meta: { filter: { label: "Process", placeholder: "All processes" } },
    cell: ({ row: { original: r } }) =>
      tagCell(PROCESS_LABELS[r.stock.process], PROCESS_TONE[r.stock.process]),
  },
  {
    id: "iso",
    header: "ISO",
    accessorFn: (r) => r.stock.boxIso,
    enableGlobalFilter: false,
    filterFn: (row, columnId, value) => String(row.getValue(columnId)) === String(value),
    meta: { filter: { label: "ISO", placeholder: "Any ISO" } },
    cell: ({ row }) => numberCell(row.original.stock.boxIso),
  },
  {
    id: "formats",
    header: "Rolls per format",
    enableSorting: false,
    cell: ({ row }) =>
      h(
        "div",
        { class: "flex flex-wrap gap-1.5" },
        Object.entries(row.original.byFormat).map(([format, n]) => tagCell(`${n} × ${format}`)),
      ),
  },
  {
    id: "expiry",
    header: "Soonest expiry",
    accessorFn: (r) => r.expiryLabel,
    cell: ({ row }) => mutedCell(row.original.expiryLabel),
  },
];
</script>

<template>
  <PageHeader title="Inventory" description="Unused rolls on hand." />
  <QueryBoundary :query="inventory" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        filter-label="Stock"
        filter-placeholder="Search by stock name..."
        empty-title="No inventory"
        empty-text="No unused rolls on hand."
        :columns="columns"
        :data="data"
        :get-row-id="(r) => r.stock.id"
      />
    </template>
  </QueryBoundary>
</template>
