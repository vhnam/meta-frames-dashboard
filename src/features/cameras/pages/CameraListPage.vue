<script setup lang="ts">
import { cameraName } from "../format";
import { useCameraList, useDeleteCamera, useSetCameraActive } from "../queries";
import type { CameraRow } from "../types";
import { Link } from "@tanstack/vue-router";
import { h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import AddButton from "#/shared/components/AddButton.vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import { PRIMARY_LINK, actionsColumn, stackCell, tagCell } from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import CameraFormDialog from "../components/CameraFormDialog.vue";
import { Switch } from "#/shared/ui/switch";
import { ask } from "#/shared/lib/ui";

// every camera, inactive ones dimmed; the Active column filters them
const cameras = useCameraList(true);
const setActive = useSetCameraActive();
const deleteCamera = useDeleteCamera();

const formOpen = ref(false);
const editing = ref<string>();
function show(id?: string) {
  editing.value = id;
  formOpen.value = true;
}

const columns: DataTableColumn<CameraRow>[] = [
  {
    id: "camera",
    header: "Camera",
    accessorFn: ({ camera: c }) => `${cameraName(c)} ${c.description}`,
    cell: ({
      row: {
        original: { camera: c },
      },
    }) =>
      stackCell(
        h(
          Link,
          { to: "/app/cameras/$cameraId", params: { cameraId: c.id }, class: PRIMARY_LINK },
          () => cameraName(c),
        ),
        c.description,
      ),
  },
  {
    id: "mount",
    enableSorting: false,
    meta: { filter: { label: "Mount", placeholder: "All mounts" } },
    header: "Mount",
    accessorFn: ({ camera: c }) => (c.fixedLens ? "Fixed lens" : c.mount),
    filterFn: "equalsString",
    cell: ({
      row: {
        original: { camera: c },
      },
    }) => tagCell(c.fixedLens ? "Fixed lens" : c.mount || "—"),
  },
  {
    id: "status",
    enableSorting: false,
    enableGlobalFilter: false,
    meta: {
      filter: { label: "Status", placeholder: "Any status", options: ["Active", "Inactive"] },
    },
    header: "Active",
    accessorFn: ({ camera: c }) => (c.active ? "Active" : "Inactive"),
    filterFn: "equalsString",
    cell: ({
      row: {
        original: { camera: c },
      },
    }) =>
      h(Switch, {
        modelValue: c.active,
        "aria-label": c.active ? "Deactivate camera" : "Activate camera",
        "onUpdate:modelValue": (v: boolean) => setActive.mutate({ id: c.id, active: v }),
      }),
  },
  actionsColumn(({ camera: c }) => ({
    onEdit: () => show(c.id),
    onDelete: async () => (await ask("Delete this camera?")) && deleteCamera.mutate(c.id),
  })),
];
</script>

<template>
  <PageHeader title="Cameras" description="Your camera bodies and what is loaded in them.">
    <template #actions>
      <AddButton @click="show()">Add camera</AddButton>
    </template>
  </PageHeader>
  <QueryBoundary :query="cameras" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        empty-title="No cameras"
        empty-text="No cameras yet."
        filter-label="Camera"
        filter-placeholder="Search by brand, model or description..."
        :columns="columns"
        :data="data"
        :get-row-id="(r) => r.camera.id"
        :row-class="(r) => (r.camera.active ? undefined : 'opacity-60')"
      />
    </template>
  </QueryBoundary>
  <CameraFormDialog v-model:open="formOpen" :camera-id="editing" />
</template>
