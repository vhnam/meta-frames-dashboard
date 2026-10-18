<script setup lang="ts">
import { useLensList, useSetLensActive } from "../queries";
import type { LensRow } from "../types";
import { Link, useRouter } from "@tanstack/vue-router";
import { h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import AddButton from "#/shared/components/AddButton.vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import { PRIMARY_LINK, numberCell, stackCell, tagCell } from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import LensFormDialog from "../components/LensFormDialog.vue";
import { Switch } from "#/shared/ui/switch";

const lenses = useLensList();
const setActive = useSetLensActive();
const formOpen = ref(false);

const router = useRouter();
const openLens = (row: LensRow) =>
  router.navigate({ to: "/app/lenses/$lensId", params: { lensId: row.lens.id } });

/** Exact match for numeric columns; dropdown values arrive as strings. */
const sameValue: NonNullable<DataTableColumn<LensRow>["filterFn"]> = (row, columnId, value) =>
  String(row.getValue(columnId)) === String(value);

const lensName = (row: LensRow) => [row.lens.brand, row.lens.model].filter(Boolean).join(" ");

const columns: DataTableColumn<LensRow>[] = [
  {
    id: "lens",
    accessorFn: lensName,
    header: "Lens",
    cell: ({ row: { original: row } }) =>
      stackCell(
        h(
          Link,
          { to: "/app/lenses/$lensId", params: { lensId: row.lens.id }, class: PRIMARY_LINK },
          () => lensName(row),
        ),
        row.cameraName ? `Built into ${row.cameraName}` : null,
      ),
  },
  {
    id: "focal",
    meta: {
      filter: {
        label: "Focal length",
        placeholder: "Any focal length",
        format: (value) => `${value}mm`,
      },
    },
    accessorFn: (row) => row.lens.focalLength,
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
        format: (value) => `f/${Number(value).toFixed(1)}`,
      },
    },
    accessorFn: (row) => row.lens.maxAperture,
    header: "Aperture",
    enableGlobalFilter: false,
    filterFn: sameValue,
    cell: ({ row }) => numberCell(`f/${row.original.lens.maxAperture.toFixed(1)}`),
  },
  {
    id: "mount",
    meta: { filter: { label: "Mount", placeholder: "All mounts" } },
    header: "Mount",
    accessorFn: (row) => (row.lens.builtInCameraId ? "Built-in" : row.lens.mount),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: row } }) =>
      tagCell(row.lens.builtInCameraId ? "Built-in" : row.lens.mount || "—"),
  },
  {
    id: "active",
    meta: {
      filter: { label: "Status", placeholder: "Any status", options: ["Active", "Inactive"] },
    },
    header: "Active",
    enableSorting: false,
    accessorFn: (row) => (row.lens.active ? "Active" : "Inactive"),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: row } }) =>
      h(Switch, {
        modelValue: row.lens.active,
        disabled: !!row.lens.builtInCameraId,
        "aria-label": row.lens.active ? "Deactivate lens" : "Activate lens",
        "onUpdate:modelValue": (active: boolean) =>
          setActive.mutate({ id: row.lens.id, active: active }),
      }),
  },
];
</script>

<template>
  <PageHeader
    title="Lenses"
    description="Prime lenses, including built-in lenses of fixed-lens cameras."
  >
    <template #actions><AddButton @click="formOpen = true">Add lens</AddButton></template>
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
        :get-row-id="(row) => row.lens.id"
        :on-select="openLens"
        :row-label="(row) => `Open ${lensName(row)}`"
        :row-class="(row) => (row.lens.active ? undefined : 'opacity-60')"
      />
    </template>
  </QueryBoundary>
  <LensFormDialog v-model:open="formOpen" />
</template>
