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
import QueryBoundary from "#/shared/components/QueryBoundary.vue";

const log = useAuditLog();
const selected = ref<AuditEntry>();
const open = ref(false);

function select(entry: AuditEntry) {
  selected.value = entry;
  open.value = true;
}

const when = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const show = (value: unknown) => (value == null ? "∅" : String(value));

/** Full diff text stays searchable; the cell only shows a short summary. */
const changeText = (e: AuditEntry) =>
  e.changes.map((c) => `${c.field}: ${show(c.before)} → ${show(c.after)}`).join("; ");

const changeSummary = (e: AuditEntry) => {
  if (!e.changes.length) return "No field changes";
  if (e.changes.length === 1) return e.changes[0]!.field;
  return `${e.changes[0]!.field} +${e.changes.length - 1}`;
};

const columns: DataTableColumn<AuditEntry>[] = [
  {
    id: "time",
    header: "When",
    accessorFn: (e) => e.createdAt,
    meta: { class: "w-40" },
    cell: ({ row }) =>
      h("span", { class: "tabular-nums" }, when.format(new Date(row.original.createdAt))),
  },
  {
    id: "entity",
    header: "Record",
    accessorFn: (e) => `${e.entityType} ${e.entityId}`,
    meta: { class: "w-[26%] overflow-hidden" },
    cell: ({ row: { original: e } }) =>
      h("div", { class: "min-w-0" }, [
        h("div", { class: `truncate ${PRIMARY_TEXT}` }, e.entityType),
        h("div", { class: "text-muted-foreground truncate font-mono text-xs" }, e.entityId),
      ]),
  },
  {
    id: "action",
    header: "Action",
    accessorFn: (e) => e.action,
    meta: { class: "w-32" },
    cell: ({ row }) => h(AuditActionBadge, { action: row.original.action }),
  },
  {
    id: "actor",
    header: "Actor",
    accessorFn: (e) => e.actor || "—",
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
        :get-row-id="(e) => String(e.id)"
        :on-select="select"
        :selected-row-id="open && selected ? String(selected.id) : undefined"
        :row-label="(e) => `${e.action} ${e.entityType} ${e.entityId}`"
      />
    </template>
  </QueryBoundary>
  <AuditLogSheet v-model:open="open" :entry="selected" />
</template>
