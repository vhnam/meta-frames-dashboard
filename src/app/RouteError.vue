<script setup lang="ts">
import { ErrorComponent, type ErrorComponentProps } from '@tanstack/vue-router';
import { watch } from 'vue';

import { reportUnexpectedError } from '#/app/providers';

const props = defineProps<{
  error: ErrorComponentProps['error'];
  info?: ErrorComponentProps['info'];
  reset: ErrorComponentProps['reset'];
}>();

// watch, not a setup call: after reset the router reuses this instance and a new error only changes the prop
watch(
  () => props.error,
  (error) => reportUnexpectedError(error, 'router error boundary'),
  {
    immediate: true,
  },
);
</script>

<template>
  <ErrorComponent v-bind="props" />
</template>
