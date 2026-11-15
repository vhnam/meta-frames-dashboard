<script setup lang="ts">
import { ref } from 'vue';

import { useScannerList } from '#/features/scanners';
import AddButton from '#/shared/components/add-button/AddButton.vue';
import type { DataTableColumn } from '#/shared/components/data-table/dataTable';
import DataTable from '#/shared/components/data-table/DataTable.vue';
import { mutedCell, primaryText } from '#/shared/components/data-table/tableCells';
import PageHeader from '#/shared/components/page-header/PageHeader.vue';
import QueryBoundary from '#/shared/components/query-boundary/QueryBoundary.vue';

import LabFormDialog from '../components/LabFormDialog.vue';
import { useLabList } from '../queries';
import type { Lab } from '../types';

const labs = useLabList();
const scanners = useScannerList();
/** The lab's scanner names, in order. */
const scannerNames = (lab: Lab) =>
  lab.scannerIds
    .map((scannerId) => scanners.data.value?.find((scanner) => scanner.id === scannerId)?.name)
    .filter(Boolean)
    .join(', ') || 'No scanners';
const open = ref(false);
const editing = ref<string>();
function show(id?: string) {
  editing.value = id;
  open.value = true;
}

const columns: DataTableColumn<Lab>[] = [
  {
    id: 'name',
    header: 'Lab',
    accessorFn: (lab) => lab.name,
    cell: ({ row }) => primaryText(row.original.name),
  },
  {
    id: 'address',
    header: 'Address',
    accessorFn: (lab) => lab.address || 'No address',
    cell: ({ row }) => mutedCell(row.original.address || 'No address'),
  },
  {
    id: 'scanners',
    header: 'Scanners',
    accessorFn: scannerNames,
    cell: ({ row }) => mutedCell(scannerNames(row.original)),
  },
];
</script>

<template>
  <PageHeader
    title="Labs"
    description="Photo labs you send film to."
  >
    <template #actions><AddButton @click="show()">Add lab</AddButton></template>
  </PageHeader>
  <QueryBoundary
    :query="labs"
    :is-empty="() => false"
  >
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
  <LabFormDialog
    v-model:open="open"
    :lab-id="editing"
  />
</template>
