<script setup lang="ts">
import { ref } from 'vue';

import AddButton from '#/shared/components/add-button/AddButton.vue';
import type { DataTableColumn } from '#/shared/components/data-table/dataTable';
import DataTable from '#/shared/components/data-table/DataTable.vue';
import {
  mutedCell,
  primaryText,
  stackCell,
  tagCell,
} from '#/shared/components/data-table/tableCells';
import PageHeader from '#/shared/components/page-header/PageHeader.vue';
import QueryBoundary from '#/shared/components/query-boundary/QueryBoundary.vue';
import { plainText } from '#/shared/lib/format';

import ScannerFormDialog from '../components/scanner-form-dialog/ScannerFormDialog.vue';
import { useScannerList } from '../queries';
import { SCANNER_KIND_LABELS } from '../types';
import type { Scanner } from '../types';

const scanners = useScannerList();
const open = ref(false);
const editing = ref<string>();
function show(id?: string) {
  editing.value = id;
  open.value = true;
}

const kindLabel = (scanner: Scanner) => (scanner.kind ? SCANNER_KIND_LABELS[scanner.kind] : '');

const columns: DataTableColumn<Scanner>[] = [
  {
    id: 'name',
    header: 'Scanner',
    accessorFn: (scanner) => scanner.name,
    cell: ({ row }) =>
      stackCell(primaryText(row.original.name), plainText(row.original.notes) || null),
  },
  {
    id: 'kind',
    header: 'Kind',
    accessorFn: kindLabel,
    cell: ({ row }) => mutedCell(kindLabel(row.original)),
  },
  {
    id: 'source',
    header: 'Source',
    accessorFn: (scanner) => (scanner.builtIn ? 'Built-in' : 'Yours'),
    cell: ({ row }) =>
      row.original.builtIn ? tagCell('Built-in', 'text-muted-foreground') : tagCell('Yours'),
  },
];
</script>

<template>
  <PageHeader
    title="Scanners"
    description="Machines your film is scanned on. Built-in lab scanners are shared and read-only."
  >
    <template #actions><AddButton @click="show()">Add scanner</AddButton></template>
  </PageHeader>
  <QueryBoundary
    :query="scanners"
    :is-empty="() => false"
  >
    <template #default="{ data }">
      <DataTable
        empty-title="No scanners"
        empty-text="No scanners yet."
        filter-label="Scanner"
        filter-placeholder="Search by brand or model..."
        :columns="columns"
        :data="data"
        :get-row-id="(scanner) => scanner.id"
        :on-select="(scanner) => show(scanner.id)"
        :row-label="
          (scanner) => (scanner.builtIn ? `View ${scanner.name}` : `Edit ${scanner.name}`)
        "
      />
    </template>
  </QueryBoundary>
  <ScannerFormDialog
    v-model:open="open"
    :scanner-id="editing"
  />
</template>
