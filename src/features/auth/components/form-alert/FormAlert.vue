<script setup lang="ts">
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-vue';

import { Alert, AlertDescription } from '#/shared/ui/alert';

defineProps<{ tone?: 'error' | 'success' }>();
</script>

<template>
  <Alert
    v-if="tone === 'success'"
    role="status"
    class="bg-status-success-bg text-status-success-fg"
  >
    <IconCircleCheck aria-hidden="true" />
    <AlertDescription class="text-current"><slot /></AlertDescription>
  </Alert>
  <Alert
    v-else
    class="bg-status-danger-bg text-status-danger-fg"
  >
    <IconAlertCircle aria-hidden="true" />
    <AlertDescription class="text-current"><slot /></AlertDescription>
  </Alert>
</template>
