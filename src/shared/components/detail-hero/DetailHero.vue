<script setup lang="ts">
import { useTitle } from '@vueuse/core';

/**
 * Header card of a detail page: accent rule, kind tag and short ID, actions, the title, chips
 * and a row of stats. Fill `stats` with `<div>`s holding a `dt` and `dd`s. The default slot
 * goes under the chips.
 */
const props = defineProps<{
  kind: string;
  id: string;
  title: string;
  description?: string;
  numericTitle?: boolean;
  wideStats?: boolean;
}>();

useTitle(() => props.title, {
  titleTemplate: (title) => `${title} | Meta Frames`,
  restoreOnUnmount: () => 'Meta Frames | Dashboard',
});
</script>

<template>
  <section class="overflow-hidden rounded-xl border bg-card shadow-sm">
    <div class="h-1 bg-linear-to-r from-primary/70 via-amber-400 to-primary" />
    <div class="grid gap-6 p-6 md:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span
            class="inline-flex items-center gap-1.5 rounded-sm border border-primary/30 bg-primary/10 px-2 py-0.5 font-semibold tracking-[0.12em] text-primary uppercase"
          >
            <i
              class="size-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            {{ kind }}
          </span>
          <span class="tracking-[0.08em] uppercase">ID: {{ id.slice(0, 8) }}</span>
        </div>
        <div
          v-if="$slots.actions"
          class="flex flex-wrap items-center gap-2"
        >
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
          <p
            v-if="description"
            class="text-sm text-muted-foreground"
          >
            {{ description }}
          </p>
        </div>
        <div
          v-if="$slots.chips"
          class="flex flex-wrap items-center gap-2"
        >
          <slot name="chips" />
        </div>
        <slot />
      </div>

      <dl
        v-if="$slots.stats"
        :class="wideStats ? 'sm:grid-cols-4' : 'sm:grid-cols-3'"
        class="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 [&_dt]:text-[0.7rem] [&_dt]:tracking-[0.12em] [&_dt]:text-muted-foreground [&_dt]:uppercase [&>div]:grid [&>div]:content-start [&>div]:gap-1"
      >
        <slot name="stats" />
      </dl>
    </div>
  </section>
</template>
