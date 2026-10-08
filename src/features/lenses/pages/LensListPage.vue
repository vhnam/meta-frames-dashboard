<script setup lang="ts">
import { useDeleteLens, useLensList, useSetLensActive } from "../queries";
import type { LensRow } from "../types";
import { h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import AddButton from "#/shared/components/AddButton.vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import {
  actionsColumn,
  numberCell,
  primaryText,
  stackCell,
  tagCell,
} from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import LensFormDialog from "../components/LensFormDialog.vue";
import { Switch } from "#/shared/ui/switch";
import { ask } from "#/shared/lib/ui";

const lenses = useLensList();
const setActive = useSetLensActive();
const deleteLens = useDeleteLens();
const formOpen = ref(false);
const editing = ref<string>();

function open(id?: string) {
  editing.value = id;
  formOpen.value = true;
}

/** Exact match for numeric columns; dropdown values arrive as strings. */
const sameValue: NonNullable<DataTableColumn<LensRow>["filterFn"]> = (row, columnId, value) =>
  String(row.getValue(columnId)) === String(value);

const lensName = (r: LensRow) => [r.lens.brand, r.lens.model].filter(Boolean).join(" ");

const columns: DataTableColumn<LensRow>[] = [
  {
    id: "lens",
    accessorFn: lensName,
    header: "Lens",
    cell: ({ row: { original: r } }) =>
      stackCell(
        primaryText(lensName(r)),
        r.cameraName ? `Built into ${r.cameraName}` : r.lens.description,
      ),
  },
  {
    id: "focal",
    meta: {
      filter: { label: "Focal length", placeholder: "Any focal length", format: (v) => `${v}mm` },
    },
    accessorFn: (r) => r.lens.focalLength,
    header: "Focal",
    enableGlobalFilter: false,
    filterFn: sameValue,
    cell: ({ row }) => numberCell(`${row.original.lens.focalLength}mm`),
  },
  {
    id: "aperture",
    meta: {
      filter: {
        label: "Aperture",
        placeholder: "Any aperture",
        format: (v) => `f/${Number(v).toFixed(1)}`,
      },
    },
    accessorFn: (r) => r.lens.maxAperture,
    header: "Aperture",
    enableGlobalFilter: false,
    filterFn: sameValue,
    cell: ({ row }) => numberCell(`f/${row.original.lens.maxAperture.toFixed(1)}`),
  },
  {
    id: "mount",
    meta: { filter: { label: "Mount", placeholder: "All mounts" } },
    header: "Mount",
    accessorFn: (r) => (r.lens.builtInCameraId ? "Built-in" : r.lens.mount),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: r } }) =>
      tagCell(r.lens.builtInCameraId ? "Built-in" : r.lens.mount || "—"),
  },
  {
    id: "active",
    meta: {
      filter: { label: "Status", placeholder: "Any status", options: ["Active", "Inactive"] },
    },
    header: "Active",
    enableSorting: false,
    accessorFn: (r) => (r.lens.active ? "Active" : "Inactive"),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: r } }) =>
      h(Switch, {
        modelValue: r.lens.active,
        disabled: !!r.lens.builtInCameraId,
        "aria-label": r.lens.active ? "Deactivate lens" : "Activate lens",
        "onUpdate:modelValue": (v: boolean) => setActive.mutate({ id: r.lens.id, active: v }),
      }),
  },
  // a built-in lens goes with its camera, so it has no Delete
  actionsColumn((r) => ({
    onEdit: () => open(r.lens.id),
    onDelete: r.lens.builtInCameraId
      ? undefined
      : () => ask("Delete this lens?") && deleteLens.mutate(r.lens.id),
  })),
];
</script>

<template>
  <PageHeader
    title="Lenses"
    description="Prime lenses, including built-in lenses of fixed-lens cameras."
  >
    <template #actions><AddButton @click="open()">Add lens</AddButton></template>
  </PageHeader>
  <QueryBoundary :query="lenses" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        empty-title="No lenses"
        empty-text="No lenses yet."
        filter-label="Lens"
        filter-placeholder="Search by brand or model..."
        :columns="columns"
        :data="data"
        :get-row-id="(r) => r.lens.id"
        :row-class="(r) => (r.lens.active ? undefined : 'opacity-60')"
      />
    </template>
  </QueryBoundary>
  <LensFormDialog v-model:open="formOpen" :lens-id="editing" />
</template>
