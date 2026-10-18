<script setup lang="ts">
import { PROCESS_TONE, TYPE_TONE, stockName } from "../format";
import { useInventory } from "../queries";
import { FILM_TYPE_LABELS, PROCESS_LABELS } from "../types";
import type { InventoryRow } from "../types";
import { Link, useRouter } from "@tanstack/vue-router";
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
import { plainText } from "#/shared/lib/format";

const inventory = useInventory({});

const router = useRouter();
const openStock = (row: InventoryRow) =>
  router.navigate({ to: "/app/stocks/$stockId", params: { stockId: row.stock.id } });

const columns: DataTableColumn<InventoryRow>[] = [
  {
    id: "stock",
    header: "Stock",
    accessorFn: (row) => stockName(row.stock),
    cell: ({ row: { original: row } }) =>
      stackCell(
        h(
          Link,
          { to: "/app/stocks/$stockId", params: { stockId: row.stock.id }, class: PRIMARY_LINK },
          () => stockName(row.stock),
        ),
        plainText(row.stock.description),
      ),
  },
  {
    id: "type",
    header: "Type",
    accessorFn: (row) => FILM_TYPE_LABELS[row.stock.type],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    meta: { filter: { label: "Type", placeholder: "All types" } },
    cell: ({ row: { original: row } }) =>
      tagCell(FILM_TYPE_LABELS[row.stock.type], TYPE_TONE[row.stock.type]),
  },
  {
    id: "process",
    header: "Process",
    accessorFn: (row) => row.stock.process,
    enableGlobalFilter: false,
    filterFn: "equalsString",
    meta: { filter: { label: "Process", placeholder: "All processes" } },
    cell: ({ row: { original: row } }) =>
      tagCell(PROCESS_LABELS[row.stock.process], PROCESS_TONE[row.stock.process]),
  },
  {
    id: "iso",
    header: "ISO",
    accessorFn: (row) => row.stock.boxIso,
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
        Object.entries(row.original.byFormat).map(([format, count]) =>
          tagCell(`${count} × ${format}`),
        ),
      ),
  },
  {
    id: "expiry",
    header: "Soonest expiry",
    accessorFn: (row) => row.expiryLabel,
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
        :get-row-id="(row) => row.stock.id"
        :on-select="openStock"
        :row-label="(row) => `Open ${stockName(row.stock)}`"
      />
    </template>
  </QueryBoundary>
</template>
