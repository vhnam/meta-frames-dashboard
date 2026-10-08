<script setup lang="ts">
import { useLabList } from "../queries";
import type { Lab } from "../types";
import { ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import AddButton from "#/shared/components/AddButton.vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import { mutedCell, primaryText } from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import LabFormDialog from "../components/LabFormDialog.vue";

const labs = useLabList();
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
    cell: ({ row }) => primaryText(row.original.name),
  },
  {
    id: "address",
    header: "Address",
    accessorFn: (l) => l.address || "No address",
    cell: ({ row }) => mutedCell(row.original.address || "No address"),
  },
];
</script>

<template>
  <PageHeader title="Labs" description="Photo labs you send film to.">
    <template #actions><AddButton @click="show()">Add lab</AddButton></template>
  </PageHeader>
  <QueryBoundary :query="labs" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        empty-title="No labs"
        empty-text="No labs yet."
        filter-label="Lab"
        filter-placeholder="Search by name or address..."
        :columns="columns"
        :data="data"
        :get-row-id="(l) => l.id"
        :on-select="(l) => show(l.id)"
        :row-label="(l) => `Edit ${l.name}`"
      />
    </template>
  </QueryBoundary>
  <LabFormDialog v-model:open="open" :lab-id="editing" />
</template>
