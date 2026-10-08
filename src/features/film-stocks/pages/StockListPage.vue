<script setup lang="ts">
import { PACKAGING_TONE, PROCESS_TONE, TYPE_TONE, stockName } from "../format";
import { useDeleteStock, useStockList } from "../queries";
import { FILM_TYPE_LABELS, PACKAGING_LABELS, PROCESS_LABELS } from "../types";
import type { StockRow } from "../types";
import { Link } from "@tanstack/vue-router";
import { h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import AddButton from "#/shared/components/AddButton.vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import {
  PRIMARY_LINK,
  actionsColumn,
  mutedCell,
  numberCell,
  stackCell,
  tagCell,
} from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import StockFormDialog from "../components/StockFormDialog.vue";
import { ask } from "#/shared/lib/ui";

const stocks = useStockList();
const deleteStock = useDeleteStock();
const formOpen = ref(false);
const editing = ref<string>();
function show(id?: string) {
  editing.value = id;
  formOpen.value = true;
}

const columns: DataTableColumn<StockRow>[] = [
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
    meta: { filter: { label: "Type", placeholder: "All types" } },
    header: "Type",
    accessorFn: (r) => FILM_TYPE_LABELS[r.stock.type],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: r } }) =>
      tagCell(FILM_TYPE_LABELS[r.stock.type], TYPE_TONE[r.stock.type]),
  },
  {
    id: "iso",
    header: "ISO",
    accessorFn: (r) => r.stock.boxIso,
    enableGlobalFilter: false,
    cell: ({ row }) => numberCell(row.original.stock.boxIso),
  },
  {
    id: "process",
    meta: { filter: { label: "Process", placeholder: "All processes" } },
    header: "Process",
    accessorFn: (r) => PROCESS_LABELS[r.stock.process],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: r } }) =>
      tagCell(PROCESS_LABELS[r.stock.process], PROCESS_TONE[r.stock.process]),
  },
  {
    id: "packaging",
    meta: { filter: { label: "Packaging", placeholder: "All packagings" } },
    header: "Packaging",
    accessorFn: (r) => PACKAGING_LABELS[r.stock.packaging],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: r } }) =>
      tagCell(PACKAGING_LABELS[r.stock.packaging], PACKAGING_TONE[r.stock.packaging]),
  },
  {
    id: "base",
    header: "Base stock",
    accessorFn: (r) => r.baseName ?? "—",
    cell: ({ row }) => mutedCell(row.original.baseName),
  },
  actionsColumn((r) => ({
    onEdit: () => show(r.stock.id),
    onDelete: async () => (await ask("Delete this film stock?")) && deleteStock.mutate(r.stock.id),
  })),
];
</script>

<template>
  <PageHeader
    title="Film stocks"
    description="Catalog of film products. A stock can exist without rolls."
  >
    <template #actions><AddButton @click="show()">Add film stock</AddButton></template>
  </PageHeader>
  <QueryBoundary :query="stocks" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        empty-title="No film stocks"
        empty-text="No film stocks yet."
        filter-label="Stock"
        filter-placeholder="Search by stock name..."
        :columns="columns"
        :data="data"
        :get-row-id="(r) => r.stock.id"
      />
    </template>
  </QueryBoundary>
  <StockFormDialog v-model:open="formOpen" :stock-id="editing" />
</template>
