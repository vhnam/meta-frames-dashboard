<script setup lang="ts">
import { SCANNERS, SCANNER_LABELS } from "../types";
import type { ScanOrder, Scanner } from "../types";
import { Checkbox } from "#/shared/ui/checkbox";

const props = defineProps<{ error?: string; locked?: Scanner[] }>();
const orders = defineModel<ScanOrder[]>({ required: true });

const find = (scanner: Scanner) => orders.value.find((o) => o.scanner === scanner);

function toggle(scanner: Scanner, on: boolean) {
  orders.value = on
    ? [...orders.value, { scanner, hiRes: false }]
    : orders.value.filter((o) => o.scanner !== scanner);
}

function setHiRes(scanner: Scanner, hiRes: boolean) {
  orders.value = orders.value.map((o) => (o.scanner === scanner ? { ...o, hiRes } : o));
}
</script>

<template>
  <fieldset class="grid gap-2">
    <legend class="mb-1 text-sm font-medium">Scanners</legend>
    <div
      v-for="s in SCANNERS"
      :key="s"
      class="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
    >
      <label class="flex items-center gap-3">
        <Checkbox
          :model-value="!!find(s)"
          :disabled="props.locked?.includes(s)"
          @update:model-value="(on) => toggle(s, on === true)"
        />
        {{ SCANNER_LABELS[s] }}
      </label>
      <label
        class="flex items-center gap-2"
        :class="find(s) ? undefined : 'text-muted-foreground opacity-60'"
      >
        <Checkbox
          :model-value="find(s)?.hiRes ?? false"
          :disabled="!find(s)"
          @update:model-value="(on) => setHiRes(s, on === true)"
        />
        Hi-res
      </label>
    </div>
    <p v-if="props.locked?.length" class="text-muted-foreground text-xs">
      A scanner with imported scans cannot be removed.
    </p>
    <p v-if="props.error" class="text-destructive text-xs">{{ props.error }}</p>
  </fieldset>
</template>
