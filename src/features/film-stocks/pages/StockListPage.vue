<script setup lang="ts">
import { PACKAGING_TONE, PROCESS_TONE, TYPE_TONE, stockName } from "../format";
import { useDeleteStock, useStockList } from "../queries";
import { FILM_TYPE_LABELS, PACKAGING_LABELS, PROCESS_LABELS } from "../types";
import type { StockRow } from "../types";
import { Link } from "@tanstack/vue-router";
import { h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import StockFormDialog from "../components/StockFormDialog.vue";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
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
    meta: { filter: { label: "Type", placeholder: "All types" } },
    header: "Type",
    accessorFn: (r) => FILM_TYPE_LABELS[r.stock.type],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row }) =>
      h(
        Badge,
        { variant: "secondary", class: TYPE_TONE[row.original.stock.type] },
        () => FILM_TYPE_LABELS[row.original.stock.type],
      ),
  },
  {
    id: "iso",
    header: "ISO",
    accessorFn: (r) => r.stock.boxIso,
    enableGlobalFilter: false,
  },
  {
    id: "process",
    meta: { filter: { label: "Process", placeholder: "All processes" } },
    header: "Process",
    accessorFn: (r) => PROCESS_LABELS[r.stock.process],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row }) =>
      h(
        Badge,
        { variant: "secondary", class: PROCESS_TONE[row.original.stock.process] },
        () => PROCESS_LABELS[row.original.stock.process],
      ),
  },
  {
    id: "packaging",
    meta: { filter: { label: "Packaging", placeholder: "All packagings" } },
    header: "Packaging",
    accessorFn: (r) => PACKAGING_LABELS[r.stock.packaging],
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row }) =>
      h(
        Badge,
        { variant: "secondary", class: PACKAGING_TONE[row.original.stock.packaging] },
        () => PACKAGING_LABELS[row.original.stock.packaging],
      ),
  },
  { id: "base", header: "Base stock", accessorFn: (r) => r.baseName ?? "—" },
  {
    id: "actions",
    header: "",
    cell: ({ row: { original: r } }) =>
      h("div", { class: "space-x-1 text-right" }, [
        h(
          Button,
          { size: "sm", variant: "outline", onClick: () => show(r.stock.id) },
          () => "Edit",
        ),
        h(
          Button,
          {
            size: "sm",
            variant: "ghost",
            onClick: () => ask("Delete this film stock?") && deleteStock.mutate(r.stock.id),
          },
          () => "Delete",
        ),
      ]),
  },
];
</script>

<template>
  <PageHeader
    title="Film stocks"
    description="Catalog of film products. A stock can exist without rolls."
  >
    <template #actions><Button @click="show()">Add film stock</Button></template>
  </PageHeader>
  <QueryBoundary :query="stocks" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        empty-title="No film stocks"
        empty-text="No film stocks yet."
        filter-label="Stock"
        filter-placeholder="Search stock name…"
        :columns="columns"
        :data="data"
        :get-row-id="(r) => r.stock.id"
      />
    </template>
  </QueryBoundary>
  <StockFormDialog v-model:open="formOpen" :stock-id="editing" />
</template>
