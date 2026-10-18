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

const showNegBadge = (status: string, atLab: boolean) =>
  (status === "scanned" || status === "developed") && atLab;
</script>

<template>
  <QueryBoundary :query="detail" empty-text="Roll not found.">
    <template #default="{ data: loaded }">
      <PageHeader
        :title="stockName(loaded.stock)"
        :description="loaded.base ? `Base stock: ${stockName(loaded.base)}` : undefined"
      >
        <template #actions>
          <RollStatusBadge :status="loaded.roll.status" />
          <Badge v-if="showNegBadge(loaded.roll.status, loaded.negativesAtLab)" variant="outline">
            Negatives at lab
          </Badge>
        </template>
      </PageHeader>

      <div class="mt-4 grid gap-4">
        <RollSummaryCard :detail="loaded" @edit="editOpen = true" @delete="doDelete" />
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
