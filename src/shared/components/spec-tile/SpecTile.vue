<script setup lang="ts">
/** One attribute on a detail page: a small caps label, the value, an optional line under it. */
defineProps<{ label: string; sub?: string }>();
</script>

<template>
  <div class="grid content-start gap-1.5 rounded-lg border bg-background/60 p-4">
    <span class="text-[0.7rem] tracking-[0.12em] text-muted-foreground uppercase">
      {{ label }}
    </span>
    <div class="font-heading text-base font-semibold"><slot /></div>
    <span
      v-if="sub"
      class="text-xs text-muted-foreground"
      >{{ sub }}</span
    >
  </div>
</template>
