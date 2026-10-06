<script setup lang="ts">
import type { RollDetail } from "../../types";
import EmptyState from "#/shared/components/EmptyState.vue";
import { Badge } from "#/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/shared/ui/card";

defineProps<{ frames: RollDetail["frames"] }>();
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Frames</CardTitle>
      <Badge v-if="frames.length" variant="secondary">{{ frames.length }}</Badge>
    </CardHeader>
    <CardContent class="text-sm">
      <EmptyState v-if="!frames.length" text="No frames yet." />
      <ul v-else class="grid gap-2">
        <li
          v-for="f in frames"
          :key="f.frame.id"
          class="flex items-start gap-3 rounded-md border px-3 py-2"
        >
          <span class="w-10 shrink-0 font-medium tabular-nums">#{{ f.frame.number }}</span>
          <span
            class="min-w-0 flex-1 break-words"
            :class="{ 'text-muted-foreground': !f.frame.notes }"
          >
            {{ f.frame.notes || "No notes" }}
          </span>
          <Badge :variant="f.scanCount ? 'outline' : 'secondary'" class="shrink-0">
            {{ f.scanCount }} {{ f.scanCount === 1 ? "scan" : "scans" }}
          </Badge>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
