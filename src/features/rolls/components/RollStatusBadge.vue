<script setup lang="ts">
import type { RollStatus } from "../types";
import { computed } from "vue";
import { Badge } from "#/shared/ui/badge";

const props = defineProps<{ status: RollStatus }>();

const LABELS: Record<RollStatus, string> = {
  in_stock: "In stock",
  in_camera: "In camera",
  done_shooting: "Done shooting",
  at_lab: "At lab",
  developed: "Developed",
  scanned: "Scanned",
};
const label = computed(() => LABELS[props.status]);
const variant = computed(() =>
  props.status === "in_camera"
    ? "default"
    : props.status === "at_lab"
      ? "destructive"
      : "secondary",
);
</script>

<template>
  <Badge :variant="variant">{{ label }}</Badge>
</template>
