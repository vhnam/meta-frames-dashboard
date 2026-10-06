<script setup lang="ts">
import { useDeleteLens, useLensList, useSetLensActive } from "../queries";
import type { LensRow } from "../types";
import { h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import LensFormDialog from "../components/LensFormDialog.vue";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
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

const columns: DataTableColumn<LensRow>[] = [
  {
    id: "lens",
    accessorFn: (r) => [r.lens.brand, r.lens.model].filter(Boolean).join(" "),
    header: "Lens",
    cell: ({ row: { original: r } }) =>
      h("span", { class: "font-medium" }, [r.lens.brand, r.lens.model].filter(Boolean).join(" ")),
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
    cell: ({ row }) => `${row.original.lens.focalLength}mm`,
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
    cell: ({ row }) => `f/${row.original.lens.maxAperture.toFixed(1)}`,
  },
  {
    id: "mount",
    meta: { filter: { label: "Mount", placeholder: "All mounts" } },
    header: "Mount",
    accessorFn: (r) => (r.lens.builtInCameraId ? "Built-in" : r.lens.mount),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: r } }) =>
      r.cameraName
        ? h(Badge, { variant: "secondary" }, () => `Built-in · ${r.cameraName}`)
        : r.lens.mount,
  },
  {
    id: "active",
    meta: { filter: { label: "Status", placeholder: "Any status" } },
    header: "Active",
    accessorFn: (r) => (r.lens.active ? "Active" : "Inactive"),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({ row: { original: r } }) =>
      h(Switch, {
        modelValue: r.lens.active,
        disabled: !!r.lens.builtInCameraId,
        "onUpdate:modelValue": (v: boolean) => setActive.mutate({ id: r.lens.id, active: v }),
      }),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row: { original: r } }) =>
      h("div", { class: "space-x-1 text-right" }, [
        h(Button, { size: "sm", variant: "outline", onClick: () => open(r.lens.id) }, () => "Edit"),
        r.lens.builtInCameraId
          ? null
          : h(
              Button,
              {
                size: "sm",
                variant: "ghost",
                onClick: () => ask("Delete this lens?") && deleteLens.mutate(r.lens.id),
              },
              () => "Delete",
            ),
      ]),
  },
];
</script>

<template>
  <PageHeader
    title="Lenses"
    description="Prime lenses, including built-in lenses of fixed-lens cameras."
  >
    <template #actions><Button @click="open()">Add lens</Button></template>
  </PageHeader>
  <QueryBoundary :query="lenses" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        empty-title="No lenses"
        empty-text="No lenses yet."
        filter-label="Lens"
        filter-placeholder="Search brand or model…"
        :columns="columns"
        :data="data"
        :get-row-id="(r) => r.lens.id"
        :row-class="(r) => (r.lens.active ? undefined : 'opacity-60')"
      />
    </template>
  </QueryBoundary>
  <LensFormDialog v-model:open="formOpen" :lens-id="editing" />
</template>
