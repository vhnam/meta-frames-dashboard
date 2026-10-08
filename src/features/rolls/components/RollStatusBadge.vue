<script setup lang="ts">
import type { RollStatus } from "../types";
import StatusBadge, { type StatusTone } from "#/shared/components/StatusBadge.vue";

defineProps<{ status: RollStatus }>();

const LABELS: Record<RollStatus, string> = {
  in_stock: "In stock",
  in_camera: "In camera",
  done_shooting: "Done shooting",
  at_lab: "At lab",
  developed: "Developed",
  scanned: "Scanned",
};

/** At lab stands out (the roll is away); in camera uses the accent; the rest stay quiet. */
const TONE: Record<RollStatus, StatusTone> = {
  in_stock: "muted",
  in_camera: "accent",
  done_shooting: "warning",
  at_lab: "danger",
  developed: "success",
  scanned: "neutral",
};
</script>

<template>
  <StatusBadge :tone="TONE[status]">{{ LABELS[status] }}</StatusBadge>
</template>
