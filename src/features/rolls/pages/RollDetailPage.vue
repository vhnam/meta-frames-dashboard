<script setup lang="ts">
import { cameraName } from "#/features/cameras";
import { stockName } from "#/features/film-stocks";
import { useDeleteRoll, useRollDetail } from "../queries";
import { isRollComplete, negativesStillAtLab } from "../types";
import type { RollDetail, RollRow } from "../types";
import { IconPencil, IconTrash } from "@tabler/icons-vue";
import { useRouter } from "@tanstack/vue-router";
import { ref } from "vue";
import DetailHero from "#/shared/components/DetailHero.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import RollStatusBadge from "../components/RollStatusBadge.vue";
import RollEditDialog from "../components/RollEditDialog.vue";
import RollLensesDialog from "../components/RollLensesDialog.vue";
import RollSummaryCard from "../components/detail/RollSummaryCard.vue";
import RollGearCard from "../components/detail/RollGearCard.vue";
import ProcessingHistoryCard from "../components/detail/ProcessingHistoryCard.vue";
import FramesCard from "../components/detail/FramesCard.vue";
import LoadRollDialog from "../components/LoadRollDialog.vue";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
import { formatDate } from "#/shared/lib/format";
import { ask, attempt } from "#/shared/lib/ui";

const props = defineProps<{ rollId: string }>();
const router = useRouter();
const detail = useRollDetail(() => props.rollId);
const deleteRoll = useDeleteRoll();

const editOpen = ref(false);
const loadOpen = ref(false);
const lensesOpen = ref(false);

async function doDelete() {
  if ((await ask("Delete this roll?")) && (await attempt(deleteRoll.mutateAsync(props.rollId))))
    router.navigate({ to: "/app/rolls" });
}

const rowOf = (rollDetail: RollDetail): RollRow => ({
  roll: rollDetail.roll,
  stockName: stockName(rollDetail.stock),
  boxIso: rollDetail.stock.boxIso,
  cameraName: rollDetail.camera ? cameraName(rollDetail.camera) : null,
  negativesAtLab: rollDetail.negativesAtLab,
});
</script>

<template>
  <QueryBoundary :query="detail" empty-text="Roll not found.">
    <template #default="{ data: loaded }">
      <div class="grid gap-6">
        <DetailHero
          kind="Roll"
          :id="loaded.roll.id"
          :title="stockName(loaded.stock)"
          :description="loaded.base ? `Base stock: ${stockName(loaded.base)}` : undefined"
        >
          <template #actions>
            <Button
              v-if="loaded.roll.status === 'in_stock'"
              variant="outline"
              class="border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              @click="doDelete"
            >
              <IconTrash aria-hidden="true" /> Delete
            </Button>
            <Button variant="outline" class="bg-card" @click="editOpen = true">
              <IconPencil aria-hidden="true" /> Edit roll
            </Button>
          </template>
          <template #chips>
            <span
              class="inline-flex h-8 items-center rounded-md border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
            >
              {{ loaded.roll.format }} · {{ loaded.roll.exposures }} exp
            </span>
            <RollStatusBadge :status="loaded.roll.status" />
            <Badge
              v-if="negativesStillAtLab(loaded.roll.status, loaded.negativesAtLab)"
              variant="outline"
            >
              Negatives at lab
            </Badge>
            <Badge
              v-if="isRollComplete(loaded.roll.status, loaded.negativesAtLab)"
              variant="secondary"
            >
              Complete
            </Badge>
          </template>
          <template #stats>
            <div>
              <dt>Camera</dt>
              <dd
                class="text-lg font-semibold"
                :class="loaded.camera ? 'text-primary' : 'text-muted-foreground'"
              >
                {{ loaded.camera ? cameraName(loaded.camera) : "—" }}
              </dd>
              <dd v-if="loaded.roll.startDate" class="text-muted-foreground text-xs">
                since {{ formatDate(loaded.roll.startDate) }}
              </dd>
            </div>
            <div>
              <dt>Frames</dt>
              <dd class="text-lg font-semibold tabular-nums">{{ loaded.frames.length }}</dd>
              <dd class="text-muted-foreground text-xs">of {{ loaded.roll.exposures }} exp</dd>
            </div>
            <div>
              <dt>Processing</dt>
              <dd class="text-lg font-semibold tabular-nums">{{ loaded.jobs.length }}</dd>
              <dd class="text-muted-foreground text-xs">
                {{ loaded.jobs.length === 1 ? "job" : "jobs" }}
              </dd>
            </div>
          </template>
        </DetailHero>

        <RollSummaryCard :detail="loaded" />
        <RollGearCard :detail="loaded" @manage-lenses="lensesOpen = true" @load="loadOpen = true" />
        <ProcessingHistoryCard
          :row="rowOf(loaded)"
          :jobs="loaded.jobs"
          :process="loaded.stock.process"
          :finished-on="loaded.roll.finishDate"
        />
        <FramesCard :frames="loaded.frames" />
      </div>

      <RollEditDialog v-model:open="editOpen" :row="rowOf(loaded)" />
      <RollLensesDialog
        v-model:open="lensesOpen"
        :roll-id="loaded.roll.id"
        :camera-name="loaded.camera ? cameraName(loaded.camera) : undefined"
        :candidates="loaded.cameraLenses"
        :selected-ids="loaded.lenses.map((lens) => lens.id)"
      />
      <LoadRollDialog v-model:open="loadOpen" :row="rowOf(loaded)" />
    </template>
  </QueryBoundary>
</template>
