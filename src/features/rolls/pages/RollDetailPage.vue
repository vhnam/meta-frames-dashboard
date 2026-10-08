<script setup lang="ts">
import { cameraName } from "#/features/cameras";
import { stockName } from "#/features/film-stocks";
import { useDeleteRoll, useRollDetail } from "../queries";
import type { RollDetail, RollRow } from "../types";
import { useRouter } from "@tanstack/vue-router";
import { ref } from "vue";
import PageHeader from "#/shared/components/PageHeader.vue";
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
import { ask, attempt } from "#/shared/lib/ui";

const props = defineProps<{ rollId: string }>();
const router = useRouter();
const detail = useRollDetail(() => props.rollId);
const deleteRoll = useDeleteRoll();

const editOpen = ref(false);
const loadOpen = ref(false);
const lensesOpen = ref(false);

async function doDelete() {
  if (ask("Delete this roll?") && (await attempt(deleteRoll.mutateAsync(props.rollId))))
    router.navigate({ to: "/app/rolls" });
}

const rowOf = (d: RollDetail): RollRow => ({
  roll: d.roll,
  stockName: stockName(d.stock),
  boxIso: d.stock.boxIso,
  cameraName: d.camera ? cameraName(d.camera) : null,
  negativesAtLab: d.negativesAtLab,
});

const showNegBadge = (status: string, atLab: boolean) =>
  (status === "scanned" || status === "developed") && atLab;
</script>

<template>
  <QueryBoundary :query="detail" empty-text="Roll not found.">
    <template #default="{ data: d }">
      <PageHeader
        :title="stockName(d.stock)"
        :description="d.base ? `Base stock: ${stockName(d.base)}` : undefined"
      >
        <template #actions>
          <RollStatusBadge :status="d.roll.status" />
          <Badge v-if="showNegBadge(d.roll.status, d.negativesAtLab)" variant="outline">
            Negatives at lab
          </Badge>
        </template>
      </PageHeader>

      <div class="mt-4 grid gap-4">
        <RollSummaryCard :detail="d" @edit="editOpen = true" @delete="doDelete" />
        <RollGearCard :detail="d" @manage-lenses="lensesOpen = true" @load="loadOpen = true" />
        <ProcessingHistoryCard
          :row="rowOf(d)"
          :jobs="d.jobs"
          :process="d.stock.process"
          :finished-on="d.roll.finishDate"
        />
        <FramesCard :frames="d.frames" />
      </div>

      <RollEditDialog v-model:open="editOpen" :row="rowOf(d)" />
      <RollLensesDialog
        v-model:open="lensesOpen"
        :roll-id="d.roll.id"
        :camera-name="d.camera ? cameraName(d.camera) : undefined"
        :candidates="d.cameraLenses"
        :selected-ids="d.lenses.map((l) => l.id)"
      />
      <LoadRollDialog v-model:open="loadOpen" :row="rowOf(d)" />
    </template>
  </QueryBoundary>
</template>
