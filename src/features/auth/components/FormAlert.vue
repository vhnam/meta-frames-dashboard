<script setup lang="ts">
defineProps<{ tone?: "error" | "success" }>();
</script>

<template>
  <div
    :role="tone === 'success' ? 'status' : 'alert'"
    :class="[
      'rounded-md px-3 py-2 text-sm',
      tone === 'success'
        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        : 'bg-destructive/10 text-destructive',
    ]"
  >
    <slot />
  </div>
</template>
