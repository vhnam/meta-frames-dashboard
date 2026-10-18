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
        <!-- header -->
        <section class="bg-card overflow-hidden rounded-xl border shadow-sm">
          <div class="from-primary/70 to-primary h-1 bg-linear-to-r via-amber-400" />
          <div class="grid gap-6 p-6 md:p-8">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                <span
                  class="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-semibold tracking-[0.12em] uppercase"
                >
                  <i class="bg-primary size-1.5 rounded-full" aria-hidden="true" />
                  Camera
                </span>
                <span class="tracking-[0.08em] uppercase"
                  >ID: {{ detail.camera.id.slice(0, 8) }}</span
                >
              </div>
              <div class="flex flex-wrap items-center gap-2">
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
                <Button
                  variant="outline"
                  class="border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  @click="doDelete"
                >
                  <IconTrash aria-hidden="true" /> Delete
                </Button>
              </div>
            </div>

            <div class="grid gap-4">
              <h1 class="text-3xl font-semibold tracking-tight md:text-4xl">
                {{ cameraName(detail.camera) }}
              </h1>
              <div class="flex flex-wrap gap-2">
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
              </div>
            </div>

            <dl class="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 sm:grid-cols-3">
              <div class="grid content-start gap-1">
                <dt class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                  Loaded
                </dt>
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
              <div class="grid content-start gap-1">
                <dt class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                  {{ detail.camera.fixedLens ? "Lens" : "Lenses" }}
                </dt>
                <dd class="text-lg font-semibold tabular-nums">{{ detail.lenses.length }}</dd>
                <dd class="text-muted-foreground text-xs">
                  {{ detail.camera.fixedLens ? "built in" : "linked" }}
                </dd>
              </div>
              <div class="grid content-start gap-1">
                <dt class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                  Shot
                </dt>
                <dd class="text-lg font-semibold tabular-nums">{{ shot }}</dd>
                <dd class="text-muted-foreground text-xs">
                  of {{ rows.length }} {{ rows.length === 1 ? "roll" : "rolls" }}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <!-- attributes -->
          <div class="grid gap-6">
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
                </div>
              </FormSection>
            </div>

            <div class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="02" title="Notes">
                <RichText
                  v-if="detail.camera.description"
                  :markdown="detail.camera.description"
                  class="bg-background/60 rounded-lg border p-4 text-sm"
                />
                <p v-else class="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                  No notes yet.
                </p>
              </FormSection>
            </div>
          </div>

          <!-- lenses and rolls -->
          <aside class="grid gap-6">
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
                <div v-if="detail.lenses.length" class="grid gap-2">
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

            <div class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="LOG" :title="`Rolls (${rows.length})`">
                <div v-if="rows.length" class="grid max-h-96 gap-2 overflow-y-auto">
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
                <p v-else class="text-muted-foreground text-sm">
                  No rolls shot in this camera yet.
                </p>
              </FormSection>
            </div>
          </aside>
        </div>
      </div>

      <CameraFormDialog v-model:open="editOpen" :camera-id="detail.camera.id" />
      <ManageLensesDialog v-model:open="lensesOpen" :camera-id="detail.camera.id" />
    </template>
  </QueryBoundary>
</template>
