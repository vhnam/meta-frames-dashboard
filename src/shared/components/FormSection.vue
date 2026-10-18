<script setup lang="ts">
defineProps<{ no: string; title: string; note?: string }>();
</script>

<template>
  <section class="grid gap-6">
    <header class="flex flex-wrap items-center gap-3 border-b pb-3">
      <span class="bg-primary/10 text-primary rounded-sm px-2 py-0.5 text-xs font-semibold">
        {{ no }}
      </span>
      <h3 class="text-primary font-sans text-xs font-semibold tracking-[0.16em] uppercase">
        {{ title }}
      </h3>
      <span v-if="note" class="text-muted-foreground ml-auto text-xs">{{ note }}</span>
      <div v-if="$slots.actions" class="ml-auto flex items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>
