<script setup lang="ts">
import type { AuditAction } from "../types";
import { Badge } from "#/shared/ui/badge";

defineProps<{ action: AuditAction }>();

const tone: Record<AuditAction, string> = {
  create: "border-transparent bg-emerald-700 text-white dark:bg-emerald-600",
  update: "border-transparent bg-sky-700 text-white dark:bg-sky-600",
  delete: "border-transparent bg-destructive text-white dark:bg-destructive/80",
};
</script>

<template>
  <Badge variant="outline" :class="['capitalize', tone[action]]">{{ action }}</Badge>
</template>
