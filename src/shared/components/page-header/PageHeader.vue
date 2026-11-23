<script setup lang="ts">
import { useTitle } from '@vueuse/core';

const props = defineProps<{ title: string; description?: string }>();

useTitle(() => props.title, {
  titleTemplate: (title) => `${title} | Meta Frames`,
  restoreOnUnmount: () => 'Meta Frames | Dashboard',
});
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight md:text-4xl">{{ title }}</h1>
      <p
        v-if="description"
        class="text-sm text-muted-foreground"
      >
        {{ description }}
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2"><slot name="actions" /></div>
  </div>
</template>
