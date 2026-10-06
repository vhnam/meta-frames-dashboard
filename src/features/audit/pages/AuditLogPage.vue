<script setup lang="ts">
import { useAuditLog } from "../queries";
import type { AuditEntry } from "../types";
import { h } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";

const log = useAuditLog();

const show = (value: unknown) => (value == null ? "∅" : String(value));

const changeText = (e: AuditEntry) =>
  e.changes.map((c) => `${c.field}: ${show(c.before)} → ${show(c.after)}`).join("; ");

const columns: DataTableColumn<AuditEntry>[] = [
  {
    id: "time",
    header: "When",
    accessorFn: (e) => e.createdAt,
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    id: "entity",
    header: "Record",
    accessorFn: (e) => `${e.entityType} ${e.entityId}`,
    cell: ({ row: { original: e } }) =>
      h("div", [
        h("span", { class: "font-medium" }, e.entityType),
        h("div", { class: "text-muted-foreground font-mono text-xs" }, e.entityId),
      ]),
  },
  { id: "action", header: "Action", accessorFn: (e) => e.action },
  {
    id: "actor",
    header: "Actor",
    accessorFn: (e) => e.actor || "—",
  },
  {
    id: "changes",
    header: "Changes",
    accessorFn: changeText,
    cell: ({ row }) =>
      h("span", { class: "text-muted-foreground text-sm" }, changeText(row.original) || "—"),
  },
];
</script>

<template>
  <PageHeader title="Audit log" description="Who changed what, newest first (last 200 changes)." />
  <QueryBoundary :query="log" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        empty-title="No changes"
        empty-text="Nothing has been changed yet."
        filter-label="Entry"
        filter-placeholder="Search record, action, actor or change…"
        :columns="columns"
        :data="data"
        :get-row-id="(e) => String(e.id)"
      />
    </template>
  </QueryBoundary>
</template>
