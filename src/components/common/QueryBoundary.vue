<script setup lang="ts" generic="TData">
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-vue";
import type { UseQueryReturnType } from "@tanstack/vue-query";
import { useIntervalFn } from "@vueuse/core";
import { computed, ref } from "vue";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import EmptyState from "./EmptyState.vue";

const props = withDefaults(
  defineProps<{
    query: UseQueryReturnType<TData, Error>;
    /** Decides when to show the empty state. Defaults to empty arrays / null. */
    isEmpty?: (data: NonNullable<TData>) => boolean;
    emptyText?: string;
    skeletonRows?: number;
    /** Hide the freshness bar, e.g. for small embedded queries. */
    quiet?: boolean;
  }>(),
  { emptyText: "Nothing here yet.", skeletonRows: 4 },
);

const q = props.query;
const now = ref(Date.now());
useIntervalFn(() => (now.value = Date.now()), 15_000);

const data = computed(() => q.data.value as TData | undefined);
const hasData = computed(() => data.value !== undefined && data.value !== null);
const empty = computed(() => {
  if (!hasData.value) return true; // loaded but null: not found
  return props.isEmpty
    ? props.isEmpty(data.value as NonNullable<TData>)
    : Array.isArray(data.value) && data.value.length === 0;
});

const ago = computed(() => {
  const seconds = Math.max(0, Math.round((now.value - q.dataUpdatedAt.value) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min ago` : `${Math.round(minutes / 60)} h ago`;
});
</script>

<template>
  <!-- loading: first fetch, nothing cached -->
  <slot v-if="q.isPending.value" name="loading">
    <div class="grid gap-2" role="status" aria-label="Loading">
      <Skeleton v-for="i in skeletonRows" :key="i" class="h-10 w-full" />
    </div>
  </slot>

  <!-- error: nothing cached to fall back on -->
  <div
    v-else-if="q.isError.value && !hasData"
    class="border-destructive/40 flex items-start gap-3 rounded-lg border p-4 text-sm"
    role="alert"
  >
    <IconAlertTriangle class="text-destructive mt-0.5 size-4 shrink-0" />
    <div class="grid flex-1 gap-1">
      <span class="font-medium">Couldn't load this data.</span>
      <span class="text-muted-foreground">{{ q.error.value?.message }}</span>
    </div>
    <Button size="sm" variant="outline" :disabled="q.isFetching.value" @click="q.refetch()">
      Retry
    </Button>
  </div>

  <template v-else>
    <!-- background refetch / refresh failure -->
    <div
      v-if="!quiet && (q.isFetching.value || q.isError.value)"
      class="text-muted-foreground flex items-center justify-end gap-2 text-xs"
      aria-live="polite"
    >
      <template v-if="q.isFetching.value">
        <IconLoader2 class="size-3 animate-spin" /> Updating…
      </template>
      <template v-else-if="q.isError.value">
        <IconAlertTriangle class="text-destructive size-3" />
        Couldn't refresh · showing data from {{ ago }}
        <Button size="sm" variant="ghost" class="h-6 px-2" @click="q.refetch()">Retry</Button>
      </template>
    </div>

    <!-- empty / not found -->
    <slot v-if="empty" name="empty">
      <EmptyState :text="emptyText" />
    </slot>

    <!-- data; dimmed while placeholder data from the previous key is shown -->
    <div v-else :class="q.isPlaceholderData.value ? 'opacity-60 transition-opacity' : undefined">
      <slot :data="data as NonNullable<TData>" />
    </div>
  </template>
</template>
