<script lang="ts">
import type { RollStage, StageDetail } from "../types";
import type { StatusTone } from "#/shared/components/StatusBadge.vue";

export const STAGE_LABELS: Record<RollStage, string> = {
  in_stock: "In stock",
  in_camera: "In camera",
  done_shooting: "Done shooting",
  processing: "Processing",
  completed: "Completed",
};

export const STAGE_DETAIL_LABELS: Record<StageDetail, string> = {
  lab_developing: "Lab developing",
  lab_scanning: "Lab scanning",
  home_developing: "Developing at home",
  home_scanning: "Scanning at home",
  rescanning: "Rescanning",
  waiting_scan: "Waiting for scan",
  waiting_home_scan: "Waiting to scan at home",
  waiting_lab_scan: "Waiting for lab scan",
  printing: "Printing",
};

const STAGE_TONE: Record<RollStage, StatusTone> = {
  in_stock: "muted",
  in_camera: "accent",
  done_shooting: "warning",
  processing: "info",
  completed: "success",
};

/** Waiting stands out (the next step is yours); work at a lab or at home stays informational. */
const DETAIL_TONE: Record<StageDetail, StatusTone> = {
  lab_developing: "info",
  lab_scanning: "info",
  home_developing: "accent",
  home_scanning: "accent",
  rescanning: "info",
  waiting_scan: "warning",
  waiting_home_scan: "warning",
  waiting_lab_scan: "warning",
  printing: "info",
};
</script>

<script setup lang="ts">
import StatusBadge from "#/shared/components/StatusBadge.vue";

/** One badge per roll: its stage, or inside processing what is being done or awaited. */
defineProps<{ stage: RollStage; detail: StageDetail | null }>();
</script>

<template>
  <StatusBadge :tone="detail ? DETAIL_TONE[detail] : STAGE_TONE[stage]">
    {{ detail ? STAGE_DETAIL_LABELS[detail] : STAGE_LABELS[stage] }}
  </StatusBadge>
</template>
