<script setup lang="ts">
import type { RollDetail } from "../../types";
import FormSection from "#/shared/components/FormSection.vue";
import { Badge } from "#/shared/ui/badge";

defineProps<{ frames: RollDetail["frames"] }>();
</script>

<template>
  <div class="bg-card rounded-xl border p-6 shadow-sm">
    <FormSection no="04" :title="frames.length ? `Frames (${frames.length})` : 'Frames'">
      <p
        v-if="!frames.length"
        class="text-muted-foreground rounded-lg border border-dashed p-4 text-sm"
      >
        No frames yet.
      </p>
      <ul v-else class="grid gap-2 text-sm">
        <li
          v-for="frame in frames"
          :key="frame.frame.id"
          class="flex items-start gap-3 rounded-lg border px-3 py-2.5"
        >
          <span class="w-10 shrink-0 font-medium tabular-nums">#{{ frame.frame.number }}</span>
          <span
            class="min-w-0 flex-1 break-words"
            :class="{ 'text-muted-foreground': !frame.frame.notes }"
          >
            {{ frame.frame.notes || "No notes" }}
          </span>
          <Badge :variant="frame.scanCount ? 'outline' : 'secondary'" class="shrink-0">
            {{ frame.scanCount }} {{ frame.scanCount === 1 ? "scan" : "scans" }}
          </Badge>
        </li>
      </ul>
    </FormSection>
  </div>
</template>
