<script setup lang="ts">
import { Skeleton } from '#/shared/ui/skeleton';
</script>

<template>
  <div
    role="status"
    aria-label="Loading page"
    class="flex flex-col gap-3 p-4"
  >
    <span class="sr-only">Loading…</span>
    <Skeleton class="h-8 w-48" />
    <Skeleton class="h-32 w-full" />
  </div>
</template>
