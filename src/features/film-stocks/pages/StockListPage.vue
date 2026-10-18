<script setup lang="ts">
import { PACKAGING_TONE, PROCESS_TONE, TYPE_TONE, stockName } from "../format";
import { useStockList } from "../queries";
import { FILM_TYPE_LABELS, PACKAGING_LABELS, PROCESS_LABELS } from "../types";
import type { StockRow } from "../types";
import { Link, useRouter } from "@tanstack/vue-router";
import { h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import AddButton from "#/shared/components/AddButton.vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import {
  PRIMARY_LINK,
  mutedCell,
  numberCell,
  stackCell,
  tagCell,
} from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import StockFormDialog from "../components/StockFormDialog.vue";

const stocks = useStockList();
const formOpen = ref(false);
const editing = ref<string>();
function show(id?: string) {
  editing.value = id;
  formOpen.value = true;
}

const router = useRouter();
const openStock = (row: StockRow) =>
  router.navigate({ to: "/app/stocks/$stockId", params: { stockId: row.stock.id } });

const columns: DataTableColumn<StockRow>[] = [
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
      ),
  },
  {
    id: "type",
    meta: { filter: { label: "Type", placeholder: "All types" } },
    header: "Type",
    accessorFn: (row) => FILM_TYPE_LABELS[row.stock.type],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: row } }) =>
      tagCell(FILM_TYPE_LABELS[row.stock.type], TYPE_TONE[row.stock.type]),
  },
  {
    id: "iso",
    header: "ISO",
    accessorFn: (row) => row.stock.boxIso,
    enableGlobalFilter: false,
    cell: ({ row }) => numberCell(row.original.stock.boxIso),
  },
  {
    id: "process",
    meta: { filter: { label: "Process", placeholder: "All processes" } },
    header: "Process",
    accessorFn: (row) => PROCESS_LABELS[row.stock.process],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: row } }) =>
      tagCell(PROCESS_LABELS[row.stock.process], PROCESS_TONE[row.stock.process]),
  },
  {
    id: "packaging",
    meta: { filter: { label: "Packaging", placeholder: "All packagings" } },
    header: "Packaging",
    accessorFn: (row) => PACKAGING_LABELS[row.stock.packaging],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: row } }) =>
      tagCell(PACKAGING_LABELS[row.stock.packaging], PACKAGING_TONE[row.stock.packaging]),
  },
  {
    id: "base",
    header: "Base stock",
    accessorFn: (row) => row.baseName ?? "—",
    cell: ({ row }) => mutedCell(row.original.baseName),
  },
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
        :get-row-id="(row) => row.stock.id"
        :on-select="openStock"
        :row-label="(row) => `Open ${stockName(row.stock)}`"
      />
    </template>
  </QueryBoundary>
  <StockFormDialog v-model:open="formOpen" :stock-id="editing" />
</template>
