<script setup lang="ts">
/** One attribute on a detail page: a small caps label, the value, an optional line under it. */
defineProps<{ label: string; sub?: string }>();
</script>

<template>
  <div class="bg-background/60 grid content-start gap-1.5 rounded-lg border p-4">
    <span class="text-muted-foreground text-[0.7rem] tracking-[0.12em] uppercase">
      {{ label }}
    </span>
    <div class="font-heading text-base font-semibold"><slot /></div>
    <span v-if="sub" class="text-muted-foreground text-xs">{{ sub }}</span>
  </div>
</template>
