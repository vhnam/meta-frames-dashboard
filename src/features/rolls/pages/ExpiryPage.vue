<script setup lang="ts">
import { formatExpiry } from "../format";
import { useExpiryReport } from "../queries";
import type { ExpiryReport, RollRow } from "../types";
import { Link } from "@tanstack/vue-router";
import { h } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import StatusBadge from "#/shared/components/StatusBadge.vue";
import { PRIMARY_LINK, numberCell, stackCell } from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";

const report = useExpiryReport();

type DatedRow = ExpiryReport["dated"][number];

const rollLink = (r: RollRow) =>
  stackCell(
    h(
      Link,
      { to: "/app/rolls/$rollId", params: { rollId: r.roll.id }, class: PRIMARY_LINK },
      () => r.stockName,
    ),
    `${r.roll.format} · ${r.roll.exposures} Exp`,
  );

const columns: DataTableColumn<DatedRow>[] = [
  {
    id: "roll",
    header: "Roll",
    accessorFn: (r) => `${r.stockName} · ${r.roll.format}`,
    cell: ({ row }) => rollLink(row.original),
  },
  {
    id: "expiry",
    header: "Expiry",
    accessorFn: (r) => formatExpiry(r.roll),
    enableGlobalFilter: false,
    cell: ({ row }) => numberCell(formatExpiry(row.original.roll)),
  },
  {
    id: "status",
    meta: { filter: { label: "Status", placeholder: "Any status" } },
    header: "Status",
    enableSorting: false,
    accessorFn: (r) => (r.expired ? "Expired" : "Soon"),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: r } }) =>
      h(StatusBadge, { tone: r.expired ? "danger" : "warning" }, () =>
        r.expired ? "Expired" : "Soon",
      ),
  },
];

const undatedColumns: DataTableColumn<RollRow>[] = [
  {
    id: "roll",
    header: "Roll",
    accessorFn: (r) => r.stockName,
    cell: ({ row }) => rollLink(row.original),
  },
];
</script>

<template>
  <PageHeader title="Expiry" description="In-stock rolls expired or expiring within 6 months." />
  <QueryBoundary :query="report" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        empty-title="Nothing expiring"
        empty-text="Nothing expires soon."
        filter-label="Roll"
        filter-placeholder="Search by stock..."
        :columns="columns"
        :data="data.dated"
        :get-row-id="(r) => r.roll.id"
      />
      <template v-if="data.undated.length">
        <h2 class="mt-4 text-xl font-semibold">
          No expiry information
          <span class="text-muted-foreground font-sans text-sm font-normal">
            ({{ data.undated.length }})
          </span>
        </h2>
        <DataTable
          hide-filters
          :columns="undatedColumns"
          :data="data.undated"
          :get-row-id="(r) => r.roll.id"
        />
      </template>
    </template>
  </QueryBoundary>
</template>
