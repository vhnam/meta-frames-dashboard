<script setup lang="ts">
import StatusBadge, { type StatusTone } from '#/shared/components/status-badge/StatusBadge.vue';

import type { AuditAction } from '../../types';

defineProps<{ action: AuditAction }>();

const tone: Record<AuditAction, StatusTone> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
};
</script>

<template>
  <StatusBadge
    :tone="tone[action]"
    class="capitalize"
    >{{ action }}</StatusBadge
  >
</template>
