<script setup lang="ts">
import { RollStatusBadge, formatExpiry, useRollList } from "#/features/rolls";
import { lensName } from "../format";
import { useDeleteLens, useLensDetail, useSetLensActive } from "../queries";
import { IconChevronRight, IconPencil, IconPower, IconTrash } from "@tabler/icons-vue";
import { Link, useRouter } from "@tanstack/vue-router";
import { computed, ref } from "vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import { RichText } from "#/shared/components/richText";
import LensFormDialog from "../components/LensFormDialog.vue";
import FormSection from "#/shared/components/FormSection.vue";
import SpecTile from "#/shared/components/SpecTile.vue";
import { Button } from "#/shared/ui/button";
import { ask, attempt } from "#/shared/lib/ui";
import { cn } from "#/shared/lib/utils";

const props = defineProps<{ lensId: string }>();
const router = useRouter();
const lens = useLensDetail(() => props.lensId);
const rolls = useRollList(() => ({ lensId: props.lensId }));
const setActive = useSetLensActive();
const deleteLens = useDeleteLens();
const editOpen = ref(false);

async function doDelete() {
  if ((await ask("Delete this lens?")) && (await attempt(deleteLens.mutateAsync(props.lensId))))
    router.navigate({ to: "/app/lenses" });
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
/** The roll this lens is shooting now, if any. */
const loaded = computed(() => rows.value.find((r) => r.roll.status === "in_camera"));
/** Rolls finished with this lens: everything past loading. */
const shot = computed(
  () =>
    rows.value.filter((r) => r.roll.status !== "in_stock" && r.roll.status !== "in_camera").length,
);
</script>

<template>
  <QueryBoundary :query="lens" empty-text="Lens not found.">
    <template #default="{ data: d }">
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
                  Lens
                </span>
                <span class="tracking-[0.08em] uppercase">ID: {{ d.lens.id.slice(0, 8) }}</span>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <!-- a built-in lens follows its camera: no Active toggle, no Delete -->
                <Button
                  v-if="!d.lens.builtInCameraId"
                  variant="outline"
                  :class="d.lens.active ? DEACTIVATE_TONE : ACTIVATE_TONE"
                  :disabled="setActive.isPending.value"
                  @click="setActive.mutate({ id: d.lens.id, active: !d.lens.active })"
                >
                  <IconPower aria-hidden="true" /> {{ d.lens.active ? "Deactivate" : "Activate" }}
                </Button>
                <Button variant="outline" class="bg-card" @click="editOpen = true">
                  <IconPencil aria-hidden="true" /> Edit lens
                </Button>
                <Button
                  v-if="!d.lens.builtInCameraId"
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
                {{ lensName(d.lens) }}
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
                  {{ d.lens.focalLength }}mm f/{{ d.lens.maxAperture.toFixed(1) }}
                </span>
                <span :class="cn(CHIP, 'bg-card text-muted-foreground')">
                  {{ d.lens.builtInCameraId ? "Built-in" : `Mount: ${d.lens.mount}` }}
                </span>
                <span :class="cn(CHIP, d.lens.active ? ACTIVE_TONE : INACTIVE_TONE)">
                  <i class="size-1.5 rounded-full bg-current" aria-hidden="true" />
                  {{ d.lens.active ? "Active" : "Inactive" }}
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
                <dd v-if="loaded?.cameraName" class="text-muted-foreground text-xs">
                  in {{ loaded.cameraName }}
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
                  <SpecTile label="Brand">
                    <span :class="{ 'text-muted-foreground font-normal': !d.lens.brand }">
                      {{ d.lens.brand || "Not set" }}
                    </span>
                  </SpecTile>
                  <SpecTile label="Model">
                    <span :class="{ 'text-muted-foreground font-normal': !d.lens.model }">
                      {{ d.lens.model || "Not set" }}
                    </span>
                  </SpecTile>
                  <SpecTile label="Mount">
                    <span :class="{ 'text-muted-foreground font-normal': d.lens.builtInCameraId }">
                      {{ d.lens.builtInCameraId ? "Built-in" : d.lens.mount }}
                    </span>
                  </SpecTile>
                </div>
              </FormSection>
            </div>

            <div class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="02" title="Optics & notes" note="Prime lenses only">
                <div class="grid gap-3 sm:grid-cols-2">
                  <SpecTile label="Focal length">{{ d.lens.focalLength }}mm</SpecTile>
                  <SpecTile label="Max aperture"> f/{{ d.lens.maxAperture.toFixed(1) }} </SpecTile>
                </div>
                <div class="grid gap-2">
                  <span class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
                    Rendering &amp; condition
                  </span>
                  <RichText
                    v-if="d.lens.description"
                    :markdown="d.lens.description"
                    class="bg-background/60 rounded-lg border p-4 text-sm"
                  />
                  <p
                    v-else
                    class="text-muted-foreground rounded-lg border border-dashed p-4 text-sm"
                  >
                    No notes yet.
                  </p>
                </div>
              </FormSection>
            </div>
          </div>

          <!-- camera and rolls -->
          <aside class="grid gap-6">
            <div v-if="d.cameraName" class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="CAM" title="Built into">
                <Link
                  to="/app/cameras/$cameraId"
                  :params="{ cameraId: d.lens.builtInCameraId! }"
                  class="hover:bg-accent/40 group flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm"
                >
                  <span class="font-medium">{{ d.cameraName }}</span>
                  <IconChevronRight
                    class="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </FormSection>
            </div>

            <div class="bg-card rounded-xl border p-6 shadow-sm">
              <FormSection no="LOG" :title="`Rolls (${rows.length})`">
                <div v-if="rows.length" class="grid max-h-96 gap-2 overflow-y-auto">
                  <Link
                    v-for="r in rows"
                    :key="r.roll.id"
                    to="/app/rolls/$rollId"
                    :params="{ rollId: r.roll.id }"
                    class="hover:bg-accent/40 group flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <span class="grid gap-0.5">
                      <span class="font-medium">{{ r.stockName }}</span>
                      <span class="text-muted-foreground text-xs">
                        {{ r.roll.format }} · {{ r.roll.exposures }} exp · Exp:
                        {{ formatExpiry(r.roll) }}
                      </span>
                    </span>
                    <span class="flex items-center gap-2">
                      <RollStatusBadge :status="r.roll.status" />
                      <IconChevronRight
                        class="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </div>
                <p v-else class="text-muted-foreground text-sm">
                  No rolls shot with this lens yet.
                </p>
              </FormSection>
            </div>
          </aside>
        </div>
      </div>

      <LensFormDialog v-model:open="editOpen" :lens-id="d.lens.id" />
    </template>
  </QueryBoundary>
</template>
