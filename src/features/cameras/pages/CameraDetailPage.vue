<script setup lang="ts">
import { lensName } from "#/features/lenses";
import { useRollList } from "#/features/rolls";
import { cameraName } from "../format";
import { useCameraDetail, useDeleteCamera, useSetCameraActive } from "../queries";
import { Link, useRouter } from "@tanstack/vue-router";
import { ref } from "vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import { RollStatusBadge } from "#/features/rolls";
import CameraFormDialog from "../components/CameraFormDialog.vue";
import ManageLensesDialog from "../components/ManageLensesDialog.vue";
import { Button } from "#/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/shared/ui/card";
import { Switch } from "#/shared/ui/switch";
import { ask, attempt } from "#/shared/lib/ui";

const props = defineProps<{ cameraId: string }>();
const router = useRouter();
const camera = useCameraDetail(() => props.cameraId);
const rolls = useRollList(() => ({ cameraId: props.cameraId }));
const setActive = useSetCameraActive();
const deleteCamera = useDeleteCamera();
const editOpen = ref(false);
const lensesOpen = ref(false);

async function doDelete() {
  if (
    (await ask("Delete this camera?")) &&
    (await attempt(deleteCamera.mutateAsync(props.cameraId)))
  )
    router.navigate({ to: "/app/cameras" });
}
</script>

<template>
  <QueryBoundary :query="camera" empty-text="Camera not found.">
    <template #default="{ data }">
      <PageHeader
        :title="cameraName(data.camera)"
        :description="data.camera.fixedLens ? 'Fixed lens' : `Mount: ${data.camera.mount}`"
      >
        <template #actions>
          <label class="flex items-center gap-2 text-sm">
            <Switch
              :model-value="data.camera.active"
              @update:model-value="
                (v: boolean) => setActive.mutate({ id: data.camera.id, active: v })
              "
            />
            Active
          </label>
          <Button variant="outline" @click="editOpen = true">Edit</Button>
          <Button v-if="!data.camera.fixedLens" variant="outline" @click="lensesOpen = true">
            Manage lenses
          </Button>
          <Button variant="ghost" @click="doDelete">Delete</Button>
        </template>
      </PageHeader>
      <p v-if="data.camera.description" class="mt-3 text-sm">{{ data.camera.description }}</p>
      <Card class="mt-4">
        <CardHeader>
          <CardTitle>{{ data.camera.fixedLens ? "Built-in lens" : "Linked lenses" }}</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-1 text-sm">
          <p v-if="!data.lenses.length" class="text-muted-foreground">None.</p>
          <span v-for="l in data.lenses" :key="l.id">{{ lensName(l) }}</span>
        </CardContent>
      </Card>
      <Card class="mt-4">
        <CardHeader
          ><CardTitle>Rolls ({{ rolls.data.value?.length ?? 0 }})</CardTitle></CardHeader
        >
        <CardContent class="grid gap-1">
          <Link
            v-for="r in rolls.data.value ?? []"
            :key="r.roll.id"
            to="/app/rolls/$rollId"
            :params="{ rollId: r.roll.id }"
            class="hover:bg-accent/40 flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            {{ r.stockName }} <RollStatusBadge :status="r.roll.status" />
          </Link>
        </CardContent>
      </Card>
      <CameraFormDialog v-model:open="editOpen" :camera-id="data.camera.id" />
      <ManageLensesDialog v-model:open="lensesOpen" :camera-id="data.camera.id" />
    </template>
  </QueryBoundary>
</template>
