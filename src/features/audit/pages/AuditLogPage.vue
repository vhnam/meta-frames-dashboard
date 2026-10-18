<script setup lang="ts">
import { useAuditLog } from "../queries";
import type { AuditEntry } from "../types";
import { IconChevronRight } from "@tabler/icons-vue";
import { h, ref } from "vue";
import AuditActionBadge from "../components/AuditActionBadge.vue";
import AuditLogSheet from "../components/AuditLogSheet.vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import { PRIMARY_TEXT } from "#/shared/components/tableCells";
import { formatDateTime } from "#/shared/lib/format";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";

const log = useAuditLog();
const selected = ref<AuditEntry>();
const open = ref(false);

function select(entry: AuditEntry) {
  selected.value = entry;
  open.value = true;
}

const show = (value: unknown) => (value == null ? "∅" : String(value));

/** Full diff text stays searchable; the cell only shows a short summary. */
const changeText = (entry: AuditEntry) =>
  entry.changes
    .map((change) => `${change.field}: ${show(change.before)} → ${show(change.after)}`)
    .join("; ");

const changeSummary = (entry: AuditEntry) => {
  if (!entry.changes.length) return "No field changes";
  if (entry.changes.length === 1) return entry.changes[0]!.field;
  return `${entry.changes[0]!.field} +${entry.changes.length - 1}`;
};

const columns: DataTableColumn<AuditEntry>[] = [
  {
    id: "time",
    header: "When",
    accessorFn: (entry) => entry.createdAt,
    meta: { class: "w-40" },
    cell: ({ row }) => h("span", { class: "tabular-nums" }, formatDateTime(row.original.createdAt)),
  },
  {
    id: "entity",
    header: "Record",
    accessorFn: (entry) => `${entry.entityType} ${entry.entityId}`,
    meta: { class: "w-[26%] overflow-hidden" },
    cell: ({ row: { original: entry } }) =>
      h("div", { class: "min-w-0" }, [
        h("div", { class: `truncate ${PRIMARY_TEXT}` }, entry.entityType),
        h("div", { class: "text-muted-foreground truncate font-mono text-xs" }, entry.entityId),
      ]),
  },
  {
    id: "action",
    header: "Action",
    accessorFn: (entry) => entry.action,
    meta: { class: "w-32" },
    cell: ({ row }) => h(AuditActionBadge, { action: row.original.action }),
  },
  {
    id: "actor",
    header: "Actor",
    accessorFn: (entry) => entry.actor || "—",
    meta: { class: "w-[16%] overflow-hidden" },
    cell: ({ row }) => h("span", { class: "block truncate" }, row.original.actor || "—"),
  },
  {
    id: "changes",
    header: "Changes",
    accessorFn: changeText,
    meta: { class: "overflow-hidden" },
    cell: ({ row }) =>
      h("span", { class: "text-muted-foreground block truncate" }, changeSummary(row.original)),
  },
  {
    id: "open",
    header: "",
    enableGlobalFilter: false,
    meta: { class: "w-8" },
    cell: () => h(IconChevronRight, { class: "text-muted-foreground size-4", "aria-hidden": true }),
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
        filter-placeholder="Search by record, action, actor or change..."
        table-class="table-fixed"
        :columns="columns"
        :data="data"
        :get-row-id="(entry) => String(entry.id)"
        :on-select="select"
        :selected-row-id="open && selected ? String(selected.id) : undefined"
        :row-label="(entry) => `${entry.action} ${entry.entityType} ${entry.entityId}`"
      />
    </template>
  </QueryBoundary>
  <AuditLogSheet v-model:open="open" :entry="selected" />
</template>
