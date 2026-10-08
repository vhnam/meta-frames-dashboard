<script setup lang="ts">
import { formatExpiry } from "../format";
import { useExpiryReport } from "../queries";
import type { ExpiryReport } from "../types";
import { Link } from "@tanstack/vue-router";
import { h } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import { Badge } from "#/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/shared/ui/card";

const report = useExpiryReport();

type DatedRow = ExpiryReport["dated"][number];

const columns: DataTableColumn<DatedRow>[] = [
  {
    id: "roll",
    header: "Roll",
    accessorFn: (r) => `${r.stockName} · ${r.roll.format}`,
    cell: ({ row: { original: r } }) =>
      h(
        Link,
        {
          to: "/app/rolls/$rollId",
          params: { rollId: r.roll.id },
          class: "font-medium hover:underline",
        },
        () => `${r.stockName} · ${r.roll.format}`,
      ),
  },
  {
    id: "expiry",
    header: "Expiry",
    accessorFn: (r) => formatExpiry(r.roll),
    enableGlobalFilter: false,
  },
  {
    id: "status",
    meta: { filter: { label: "Status", placeholder: "Any status" } },
    header: "Status",
    accessorFn: (r) => (r.expired ? "Expired" : "Soon"),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: r } }) =>
      h(Badge, { variant: r.expired ? "destructive" : "secondary" }, () =>
        r.expired ? "Expired" : "Soon",
      ),
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
        filter-placeholder="Search stock…"
        :columns="columns"
        :data="data.dated"
        :get-row-id="(r) => r.roll.id"
      />
      <Card v-if="data.undated.length" class="mt-4">
        <CardHeader>
          <CardTitle>No expiry information ({{ data.undated.length }})</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-1">
          <Link
            v-for="r in data.undated"
            :key="r.roll.id"
            to="/app/rolls/$rollId"
            :params="{ rollId: r.roll.id }"
            class="text-sm hover:underline"
          >
            {{ r.stockName }} · {{ r.roll.format }}
          </Link>
        </CardContent>
      </Card>
    </template>
  </QueryBoundary>
</template>
