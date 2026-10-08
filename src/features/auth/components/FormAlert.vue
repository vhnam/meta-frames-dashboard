<script setup lang="ts">
import { IconAlertCircle, IconCircleCheck } from "@tabler/icons-vue";
import { Alert, AlertDescription } from "#/shared/ui/alert";

defineProps<{ tone?: "error" | "success" }>();
</script>

<template>
  <Alert
    v-if="tone === 'success'"
    role="status"
    class="border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
  >
    <IconCircleCheck aria-hidden="true" />
    <AlertDescription class="text-current"><slot /></AlertDescription>
  </Alert>
  <Alert v-else variant="destructive" class="border-destructive/25 bg-destructive/10">
    <IconAlertCircle aria-hidden="true" />
    <AlertDescription><slot /></AlertDescription>
  </Alert>
</template>
