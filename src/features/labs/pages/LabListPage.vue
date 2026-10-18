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
    accessorFn: (lab) => lab.name,
    cell: ({ row }) => primaryText(row.original.name),
  },
  {
    id: "address",
    header: "Address",
    accessorFn: (lab) => lab.address || "No address",
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
        :get-row-id="(lab) => lab.id"
        :on-select="(lab) => show(lab.id)"
        :row-label="(lab) => `Edit ${lab.name}`"
      />
    </template>
  </QueryBoundary>
  <LabFormDialog v-model:open="open" :lab-id="editing" />
</template>
