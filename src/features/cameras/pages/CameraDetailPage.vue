<script setup lang="ts">
import { lensName } from "#/features/lenses";
import { RollStatusBadge, formatExpiry, useRollList } from "#/features/rolls";
import { cameraName } from "../format";
import { useCameraDetail, useDeleteCamera, useSetCameraActive } from "../queries";
import {
  IconAperture,
  IconChevronRight,
  IconPencil,
  IconPower,
  IconTrash,
} from "@tabler/icons-vue";
import { Link, useRouter } from "@tanstack/vue-router";
import { computed, ref } from "vue";
import DetailHero from "#/shared/components/DetailHero.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import { RichText } from "#/shared/components/richText";
import CameraFormDialog from "../components/CameraFormDialog.vue";
import ManageLensesDialog from "../components/ManageLensesDialog.vue";
import FormSection from "#/shared/components/FormSection.vue";
import SpecTile from "#/shared/components/SpecTile.vue";
import { Button } from "#/shared/ui/button";
import { ask, attempt } from "#/shared/lib/ui";
import { cn } from "#/shared/lib/utils";

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

const CHIP = "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm";
const ACTIVE_TONE =
  "border-transparent bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100";
const INACTIVE_TONE =
  "border-transparent bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100";
/** Header button tints, matching Delete's: amber to switch off, emerald to switch on. */
const DEACTIVATE_TONE =
  "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900";
const ACTIVATE_TONE =
  "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900";

const rows = computed(() => rolls.data.value ?? []);
/** The roll in the camera now, if any. */
const loaded = computed(() => rows.value.find((row) => row.roll.status === "in_camera"));
/** Rolls finished in this camera: everything past loading. */
const shot = computed(
  () =>
    rows.value.filter((row) => row.roll.status !== "in_stock" && row.roll.status !== "in_camera")
      .length,
);
</script>

<template>
  <QueryBoundary :query="camera" empty-text="Camera not found.">
    <template #default="{ data: detail }">
      <div class="grid gap-6">
        <DetailHero kind="Camera" :id="detail.camera.id" :title="cameraName(detail.camera)">
          <template #actions>
            <Button
              variant="outline"
              class="border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              @click="doDelete"
            >
              <IconTrash aria-hidden="true" /> Delete
            </Button>
            <Button
              variant="outline"
              :class="detail.camera.active ? DEACTIVATE_TONE : ACTIVATE_TONE"
              :disabled="setActive.isPending.value"
              @click="setActive.mutate({ id: detail.camera.id, active: !detail.camera.active })"
            >
              <IconPower aria-hidden="true" />
              {{ detail.camera.active ? "Deactivate" : "Activate" }}
            </Button>
            <Button variant="outline" class="bg-card" @click="editOpen = true">
              <IconPencil aria-hidden="true" /> Edit camera
            </Button>
          </template>
          <template #chips>
            <span
              :class="
                cn(
                  CHIP,
                  'border-amber-300 bg-amber-50 font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
                )
              "
            >
              {{ detail.camera.fixedLens ? "Fixed lens" : `Mount: ${detail.camera.mount}` }}
            </span>
            <span :class="cn(CHIP, detail.camera.active ? ACTIVE_TONE : INACTIVE_TONE)">
              <i class="size-1.5 rounded-full bg-current" aria-hidden="true" />
              {{ detail.camera.active ? "Active" : "Inactive" }}
            </span>
          </template>
          <template #stats>
            <div>
              <dt>Loaded</dt>
              <dd
                :class="
                  cn('text-lg font-semibold', loaded ? 'text-primary' : 'text-muted-foreground')
                "
              >
                {{ loaded ? loaded.stockName : "—" }}
              </dd>
              <dd v-if="loaded" class="text-muted-foreground text-xs">
                {{ loaded.roll.format }} · {{ loaded.roll.exposures }} exp
              </dd>
            </div>
            <div>
              <dt>{{ detail.camera.fixedLens ? "Lens" : "Lenses" }}</dt>
              <dd class="text-lg font-semibold tabular-nums">{{ detail.lenses.length }}</dd>
              <dd class="text-muted-foreground text-xs">
                {{ detail.camera.fixedLens ? "built in" : "linked" }}
              </dd>
            </div>
            <div>
              <dt>Shot</dt>
              <dd class="text-lg font-semibold tabular-nums">{{ shot }}</dd>
              <dd class="text-muted-foreground text-xs">
                of {{ rows.length }} {{ rows.length === 1 ? "roll" : "rolls" }}
              </dd>
            </div>
          </template>
        </DetailHero>

        <div class="bg-card rounded-xl border p-6 shadow-sm">
          <FormSection no="01" title="Primary specifications">
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <SpecTile label="Brand">{{ detail.camera.brand }}</SpecTile>
              <SpecTile label="Model">{{ detail.camera.model }}</SpecTile>
              <SpecTile label="Mount">
                <span :class="{ 'text-muted-foreground font-normal': detail.camera.fixedLens }">
                  {{ detail.camera.fixedLens ? "Fixed lens" : detail.camera.mount }}
                </span>
              </SpecTile>
              <SpecTile
                v-if="detail.camera.description"
                label="Notes"
                class="sm:col-span-2 xl:col-span-3"
              >
                <RichText
                  :markdown="detail.camera.description"
                  class="font-sans text-sm font-normal"
                />
              </SpecTile>
            </div>
          </FormSection>
        </div>

        <!-- rolls and lenses: on desktop the list bodies share one max height and scroll inside -->
        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div class="bg-card rounded-xl border p-6 shadow-sm">
            <FormSection no="LOG" :title="`Rolls (${rows.length})`">
              <div v-if="rows.length" class="grid gap-2 lg:max-h-96 lg:overflow-y-auto">
                <Link
                  v-for="row in rows"
                  :key="row.roll.id"
                  to="/app/rolls/$rollId"
                  :params="{ rollId: row.roll.id }"
                  class="hover:bg-accent/40 group flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm"
                >
                  <span class="grid gap-0.5">
                    <span class="font-medium">{{ row.stockName }}</span>
                    <span class="text-muted-foreground text-xs">
                      {{ row.roll.format }} · {{ row.roll.exposures }} exp · Exp:
                      {{ formatExpiry(row.roll) }}
                    </span>
                  </span>
                  <span class="flex items-center gap-2">
                    <RollStatusBadge :status="row.roll.status" />
                    <IconChevronRight
                      class="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </div>
              <p v-else class="text-muted-foreground text-sm">No rolls shot in this camera yet.</p>
            </FormSection>
          </div>

          <div class="bg-card rounded-xl border p-6 shadow-sm">
            <FormSection
              no="LNS"
              :title="
                detail.camera.fixedLens
                  ? 'Built-in lens'
                  : `Linked lenses (${detail.lenses.length})`
              "
            >
              <template v-if="!detail.camera.fixedLens" #actions>
                <Button variant="outline" size="xs" @click="lensesOpen = true">
                  <IconAperture aria-hidden="true" /> Manage
                </Button>
              </template>
              <div v-if="detail.lenses.length" class="grid gap-2 lg:max-h-96 lg:overflow-y-auto">
                <Link
                  v-for="lens in detail.lenses"
                  :key="lens.id"
                  to="/app/lenses/$lensId"
                  :params="{ lensId: lens.id }"
                  class="hover:bg-accent/40 group flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm"
                >
                  <span class="grid gap-0.5">
                    <span class="font-medium">{{ lensName(lens) }}</span>
                    <span v-if="lens.mount" class="text-muted-foreground text-xs">
                      Mount: {{ lens.mount }}
                    </span>
                  </span>
                  <IconChevronRight
                    class="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
              <div
                v-else
                class="text-muted-foreground grid justify-items-start gap-3 rounded-lg border border-dashed p-4 text-sm"
              >
                No lenses linked yet.
                <Button
                  v-if="!detail.camera.fixedLens"
                  variant="outline"
                  size="sm"
                  @click="lensesOpen = true"
                >
                  <IconAperture aria-hidden="true" /> Link lenses
                </Button>
              </div>
            </FormSection>
          </div>
        </div>
      </div>

      <CameraFormDialog v-model:open="editOpen" :camera-id="detail.camera.id" />
      <ManageLensesDialog v-model:open="lensesOpen" :camera-id="detail.camera.id" />
    </template>
  </QueryBoundary>
</template>
