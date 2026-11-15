<script setup lang="ts">
defineProps<{ no: string; title: string; note?: string }>();
</script>

<template>
  <section class="grid grid-cols-[minmax(0,1fr)] gap-6">
    <header class="flex flex-wrap items-center gap-3 border-b pb-3">
      <span class="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
        {{ no }}
      </span>
      <h3 class="font-sans text-xs font-semibold tracking-[0.16em] text-primary uppercase">
        {{ title }}
      </h3>
      <span
        v-if="note"
        class="ml-auto text-xs text-muted-foreground"
        >{{ note }}</span
      >
      <div
        v-if="$slots.actions"
        class="ml-auto flex items-center gap-2"
      >
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>
