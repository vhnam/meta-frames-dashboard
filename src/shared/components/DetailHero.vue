<script setup lang="ts">
/**
 * Header card of a detail page: accent rule, kind tag and short ID, actions, the title, chips
 * and a row of stats. Fill `stats` with `<div>`s holding a `dt` and `dd`s. The default slot
 * goes under the chips.
 */
defineProps<{
  kind: string;
  id: string;
  title: string;
  description?: string;
  numericTitle?: boolean;
  wideStats?: boolean;
}>();
</script>

<template>
  <section class="bg-card overflow-hidden rounded-xl border shadow-sm">
    <div class="from-primary/70 to-primary h-1 bg-linear-to-r via-amber-400" />
    <div class="grid gap-6 p-6 md:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
          <span
            class="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-semibold tracking-[0.12em] uppercase"
          >
            <i class="bg-primary size-1.5 rounded-full" aria-hidden="true" />
            {{ kind }}
          </span>
          <span class="tracking-[0.08em] uppercase">ID: {{ id.slice(0, 8) }}</span>
        </div>
        <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
          <slot name="actions" />
        </div>
      </div>

      <div class="grid gap-4">
        <div class="grid gap-2">
          <h1
            :class="[
              'text-3xl font-semibold tracking-tight md:text-4xl',
              numericTitle && 'tabular-nums',
            ]"
          >
            {{ title }}
          </h1>
          <p v-if="description" class="text-muted-foreground text-sm">{{ description }}</p>
        </div>
        <div v-if="$slots.chips" class="flex flex-wrap items-center gap-2">
          <slot name="chips" />
        </div>
        <slot />
      </div>

      <dl
        v-if="$slots.stats"
        :class="wideStats ? 'sm:grid-cols-4' : 'sm:grid-cols-3'"
        class="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 [&_dt]:text-muted-foreground [&_dt]:text-[0.7rem] [&_dt]:tracking-[0.12em] [&_dt]:uppercase [&>div]:grid [&>div]:content-start [&>div]:gap-1"
      >
        <slot name="stats" />
      </dl>
    </div>
  </section>
</template>
