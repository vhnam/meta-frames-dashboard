<script setup lang="ts">
import { Link } from "@tanstack/vue-router";
import { h, ref } from "vue";
import { useDeleteStock, useStockList } from "#/api";
import type { StockRow } from "#/api";
import DataTable from "#/components/common/DataTable.vue";
import type { DataTableColumn } from "#/components/common/dataTable";
import PageHeader from "#/components/common/PageHeader.vue";
import QueryBoundary from "#/components/common/QueryBoundary.vue";
import StockFormDialog from "#/components/dialogs/StockFormDialog.vue";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { stockName } from "#/domain/format";
import { FILM_TYPE_LABELS, PACKAGING_LABELS } from "#/domain/types";
import { ask } from "#/lib/ui";

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
          to: "/stocks/$stockId",
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
      h(Badge, { variant: "secondary" }, () => FILM_TYPE_LABELS[row.original.stock.type]),
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
    accessorFn: (r) => r.stock.process,
    enableGlobalFilter: false,
    filterFn: "equalsString",
  },
  {
    id: "packaging",
    meta: { filter: { label: "Packaging", placeholder: "All packagings" } },
    header: "Packaging",
    accessorFn: (r) => PACKAGING_LABELS[r.stock.packaging],
    enableGlobalFilter: false,
    filterFn: "equalsString",
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
