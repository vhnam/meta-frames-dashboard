<script setup lang="ts">
import { useDeleteLab, useLabList } from "../queries";
import type { Lab } from "../types";
import { h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import LabFormDialog from "../components/LabFormDialog.vue";
import { Button } from "#/shared/ui/button";
import { ask } from "#/shared/lib/ui";

const labs = useLabList();
const deleteLab = useDeleteLab();
const open = ref(false);
const editing = ref<string>();
function show(id?: string) {
  editing.value = id;
  open.value = true;
}

const columns: DataTableColumn<Lab>[] = [
  {
    id: "name",
    header: "Lab",
    accessorFn: (l) => l.name,
    cell: ({ row }) => h("span", { class: "font-medium" }, row.original.name),
  },
  {
    id: "address",
    header: "Address",
    accessorFn: (l) => l.address || "No address",
    cell: ({ row }) =>
      h("span", { class: "text-muted-foreground" }, row.original.address || "No address"),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row: { original: l } }) =>
      h("div", { class: "space-x-1 text-right" }, [
        h(Button, { size: "sm", variant: "outline", onClick: () => show(l.id) }, () => "Edit"),
        h(
          Button,
          {
            size: "sm",
            variant: "ghost",
            disabled: deleteLab.isPending.value,
            onClick: () => ask("Delete this lab?") && deleteLab.mutate(l.id),
          },
          () => "Delete",
        ),
      ]),
  },
];
</script>

<template>
  <PageHeader title="Labs" description="Photo labs you send film to.">
    <template #actions><Button @click="show()">Add lab</Button></template>
  </PageHeader>
  <QueryBoundary :query="labs" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        empty-title="No labs"
        empty-text="No labs yet."
        filter-label="Lab"
        filter-placeholder="Search name or address…"
        :columns="columns"
        :data="data"
        :get-row-id="(l) => l.id"
      />
    </template>
  </QueryBoundary>
  <LabFormDialog v-model:open="open" :lab-id="editing" />
</template>
