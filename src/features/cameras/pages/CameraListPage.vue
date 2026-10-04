<script setup lang="ts">
import { cameraName } from "../format";
import { useCameraList, useDeleteCamera, useSetCameraActive } from "../queries";
import type { CameraRow } from "../types";
import { Link } from "@tanstack/vue-router";
import { h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import CameraFormDialog from "../components/CameraFormDialog.vue";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
import { Switch } from "#/shared/ui/switch";
import { ask } from "#/shared/lib/ui";

const showInactive = ref(false);
const cameras = useCameraList(showInactive);
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
    accessorFn: ({ camera: c }) => cameraName(c),
    cell: ({
      row: {
        original: { camera: c },
      },
    }) =>
      h(
        Link,
        {
          to: "/cameras/$cameraId",
          params: { cameraId: c.id },
          class: "font-medium hover:underline",
        },
        () => cameraName(c),
      ),
  },
  {
    id: "mount",
    meta: { filter: { label: "Mount", placeholder: "All mounts" } },
    header: "Mount",
    accessorFn: ({ camera: c }) => (c.fixedLens ? "Fixed lens" : c.mount),
    filterFn: "equalsString",
    cell: ({
      row: {
        original: { camera: c },
      },
    }) => h(Badge, { variant: "secondary" }, () => (c.fixedLens ? "Fixed lens" : c.mount)),
  },
  {
    id: "description",
    header: "Description",
    accessorFn: ({ camera: c }) => c.description,
    cell: ({ row }) =>
      h("span", { class: "text-muted-foreground" }, row.original.camera.description || "—"),
  },
  {
    id: "status",
    meta: { filter: { label: "Status", placeholder: "Any status" } },
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
        "onUpdate:modelValue": (v: boolean) => setActive.mutate({ id: c.id, active: v }),
      }),
  },
  {
    id: "actions",
    header: "",
    cell: ({
      row: {
        original: { camera: c },
      },
    }) =>
      h("div", { class: "space-x-1 text-right" }, [
        h(Button, { size: "sm", variant: "outline", onClick: () => show(c.id) }, () => "Edit"),
        h(
          Button,
          {
            size: "sm",
            variant: "ghost",
            onClick: () => ask("Delete this camera?") && deleteCamera.mutate(c.id),
          },
          () => "Delete",
        ),
      ]),
  },
];
</script>

<template>
  <PageHeader title="Cameras" description="Your camera bodies and what is loaded in them.">
    <template #actions>
      <Button variant="outline" @click="showInactive = !showInactive">
        {{ showInactive ? "Hide" : "Show" }} inactive
      </Button>
      <Button @click="show()">Add camera</Button>
    </template>
  </PageHeader>
  <QueryBoundary :query="cameras" :is-empty="() => false">
    <template #default="{ data }">
      <DataTable
        empty-title="No cameras"
        empty-text="No cameras yet."
        filter-label="Camera"
        filter-placeholder="Search brand or model…"
        :columns="columns"
        :data="data"
        :get-row-id="(r) => r.camera.id"
        :row-class="(r) => (r.camera.active ? undefined : 'opacity-60')"
      />
    </template>
  </QueryBoundary>
  <CameraFormDialog v-model:open="formOpen" :camera-id="editing" />
</template>
