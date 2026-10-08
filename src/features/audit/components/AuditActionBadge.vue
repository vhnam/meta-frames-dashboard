<script setup lang="ts">
import type { AuditAction } from "../types";
import StatusBadge, { type StatusTone } from "#/shared/components/StatusBadge.vue";

defineProps<{ action: AuditAction }>();

const tone: Record<AuditAction, StatusTone> = {
  create: "success",
  update: "info",
  delete: "danger",
};
</script>

<template>
  <StatusBadge :tone="tone[action]" class="capitalize">{{ action }}</StatusBadge>
</template>
