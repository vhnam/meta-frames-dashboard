<script setup lang="ts">
import type { AuditEntry } from "../types";
import AuditActionBadge from "./AuditActionBadge.vue";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "#/shared/ui/sheet";

const open = defineModel<boolean>("open", { default: false });

defineProps<{ entry?: AuditEntry }>();

function show(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value, null, 2);
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent side="right" class="w-full gap-0 overflow-hidden p-0 sm:max-w-lg">
      <SheetHeader v-if="entry" class="border-b pr-12">
        <SheetTitle class="flex items-center gap-2">
          <span class="capitalize">{{ entry.entityType }}</span>
          <AuditActionBadge :action="entry.action" />
        </SheetTitle>
        <SheetDescription>
          {{ new Date(entry.createdAt).toLocaleString() }}
          · {{ entry.actor || "Unknown actor" }}
        </SheetDescription>
      </SheetHeader>
      <div v-if="entry" class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <dl class="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2 text-sm">
          <dt class="text-muted-foreground">Record</dt>
          <dd class="font-mono text-xs break-all">{{ entry.entityId }}</dd>
          <dt class="text-muted-foreground">Actor</dt>
          <dd>{{ entry.actor || "—" }}</dd>
        </dl>
        <h2 class="mt-6 mb-2 text-sm font-medium">Changes</h2>
        <p v-if="!entry.changes.length" class="text-muted-foreground text-sm">
          No field changes recorded.
        </p>
        <ul v-else class="divide-border divide-y rounded-lg border">
          <li v-for="change in entry.changes" :key="change.field" class="grid gap-2 p-3">
            <div class="font-mono text-xs">{{ change.field }}</div>
            <div class="grid gap-2 sm:grid-cols-2">
              <div class="min-w-0">
                <div class="text-muted-foreground text-xs">Before</div>
                <pre class="text-sm break-all whitespace-pre-wrap">{{ show(change.before) }}</pre>
              </div>
              <div class="min-w-0">
                <div class="text-muted-foreground text-xs">After</div>
                <pre class="text-sm break-all whitespace-pre-wrap">{{ show(change.after) }}</pre>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </SheetContent>
  </Sheet>
</template>
