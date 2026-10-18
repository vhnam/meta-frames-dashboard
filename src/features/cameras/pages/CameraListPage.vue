<script setup lang="ts">
import { cameraName } from "../format";
import { useCameraList, useSetCameraActive } from "../queries";
import type { CameraRow } from "../types";
import { Link, useRouter } from "@tanstack/vue-router";
import { h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import AddButton from "#/shared/components/AddButton.vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import { PRIMARY_LINK, stackCell, tagCell } from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import CameraFormDialog from "../components/CameraFormDialog.vue";
import { Switch } from "#/shared/ui/switch";

// every camera, inactive ones dimmed; the Active column filters them
const cameras = useCameraList(true);
const setActive = useSetCameraActive();

const formOpen = ref(false);
const editing = ref<string>();
function show(id?: string) {
  editing.value = id;
  formOpen.value = true;
}

const router = useRouter();
const openCamera = (row: CameraRow) =>
  router.navigate({ to: "/app/cameras/$cameraId", params: { cameraId: row.camera.id } });

const columns: DataTableColumn<CameraRow>[] = [
  {
    id: "camera",
    header: "Camera",
    accessorFn: ({ camera }) => `${cameraName(camera)} ${camera.description}`,
    cell: ({
      row: {
        original: { camera },
      },
    }) =>
      stackCell(
        h(
          Link,
          { to: "/app/cameras/$cameraId", params: { cameraId: camera.id }, class: PRIMARY_LINK },
          () => cameraName(camera),
        ),
      ),
  },
  {
    id: "mount",
    enableSorting: false,
    meta: { filter: { label: "Mount", placeholder: "All mounts" } },
    header: "Mount",
    accessorFn: ({ camera }) => (camera.fixedLens ? "Fixed lens" : camera.mount),
    filterFn: "equalsString",
    cell: ({
      row: {
        original: { camera },
      },
    }) => tagCell(camera.fixedLens ? "Fixed lens" : camera.mount || "—"),
  },
  {
    id: "status",
    enableSorting: false,
    enableGlobalFilter: false,
    meta: {
      filter: { label: "Status", placeholder: "Any status", options: ["Active", "Inactive"] },
    },
    header: "Active",
    accessorFn: ({ camera }) => (camera.active ? "Active" : "Inactive"),
    filterFn: "equalsString",
    cell: ({
      row: {
        original: { camera },
      },
    }) =>
      h(Switch, {
        modelValue: camera.active,
        "aria-label": camera.active ? "Deactivate camera" : "Activate camera",
        "onUpdate:modelValue": (active: boolean) =>
          setActive.mutate({ id: camera.id, active: active }),
      }),
  },
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
        :get-row-id="(row) => row.camera.id"
        :on-select="openCamera"
        :row-label="(row) => `Open ${cameraName(row.camera)}`"
        :row-class="(row) => (row.camera.active ? undefined : 'opacity-60')"
      />
    </template>
  </QueryBoundary>
  <CameraFormDialog v-model:open="formOpen" :camera-id="editing" />
</template>
