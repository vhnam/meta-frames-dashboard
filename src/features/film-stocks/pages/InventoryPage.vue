<script setup lang="ts">
import { stockName } from "../format";
import { useInventory } from "../queries";
import { FILM_TYPE_LABELS } from "../types";
import type { InventoryRow } from "../types";
import { Link } from "@tanstack/vue-router";
import { h } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";

const inventory = useInventory({});

const columns: DataTableColumn<InventoryRow>[] = [
  {
    id: "stock",
    header: "Stock",
    accessorFn: (r) => stockName(r.stock),
    cell: ({ row: { original: r } }) =>
      h(
        Link,
        {
          to: "/app/stocks/$stockId",
          params: { stockId: r.stock.id },
          class: "font-medium hover:underline",
        },
        () => stockName(r.stock),
      ),
  },
  {
    id: "type",
    header: "Type",
    accessorFn: (r) => FILM_TYPE_LABELS[r.stock.type],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    meta: { filter: { label: "Type", placeholder: "All types" } },
  },
  {
    id: "process",
    header: "Process",
    accessorFn: (r) => r.stock.process,
    enableGlobalFilter: false,
    filterFn: "equalsString",
    meta: { filter: { label: "Process", placeholder: "All processes" } },
  },
  {
    id: "iso",
    header: "ISO",
    accessorFn: (r) => r.stock.boxIso,
    enableGlobalFilter: false,
    filterFn: (row, columnId, value) => String(row.getValue(columnId)) === String(value),
    meta: { filter: { label: "ISO", placeholder: "Any ISO" } },
  },
  {
    id: "formats",
    header: "Rolls per format",
    cell: ({ row }) =>
      Object.entries(row.original.byFormat)
        .map(([k, n]) => `${n} × ${k}`)
        .join(", "),
  },
  { id: "expiry", header: "Soonest expiry", accessorFn: (r) => r.expiryLabel },
];
</script>

<template>
  <PageHeader title="Inventory" description="Unused rolls on hand." />
  <QueryBoundary :query="inventory" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        filter-label="Stock"
        filter-placeholder="Search stock name…"
        empty-title="No inventory"
        empty-text="No unused rolls on hand."
        :columns="columns"
        :data="data"
        :get-row-id="(r) => r.stock.id"
      />
    </template>
  </QueryBoundary>
</template>
