<script setup lang="ts">
import { SCANNERS, SCANNER_LABELS } from "../types";
import type { ScanOrder, Scanner } from "../types";
import { Checkbox } from "#/shared/ui/checkbox";

const props = defineProps<{ error?: string; locked?: Scanner[] }>();
const orders = defineModel<ScanOrder[]>({ required: true });

const find = (scanner: Scanner) => orders.value.find((order) => order.scanner === scanner);

function toggle(scanner: Scanner, on: boolean) {
  orders.value = on
    ? [...orders.value, { scanner, hiRes: false }]
    : orders.value.filter((order) => order.scanner !== scanner);
}

function setHiRes(scanner: Scanner, hiRes: boolean) {
  orders.value = orders.value.map((order) =>
    order.scanner === scanner ? { ...order, hiRes } : order,
  );
}
</script>

<template>
  <fieldset class="grid gap-2">
    <legend class="font-heading mb-1 text-sm font-medium">Scanners</legend>
    <div
      v-for="scanner in SCANNERS"
      :key="scanner"
      class="dark:bg-input/30 flex h-11 items-center justify-between gap-3 rounded-md border bg-white px-3 text-sm"
    >
      <label class="flex items-center gap-3">
        <Checkbox
          :model-value="!!find(scanner)"
          :disabled="props.locked?.includes(scanner)"
          @update:model-value="(on) => toggle(scanner, on === true)"
        />
        {{ SCANNER_LABELS[scanner] }}
      </label>
      <label
        class="flex items-center gap-2"
        :class="find(scanner) ? undefined : 'text-muted-foreground opacity-60'"
      >
        <Checkbox
          :model-value="find(scanner)?.hiRes ?? false"
          :disabled="!find(scanner)"
          @update:model-value="(on) => setHiRes(scanner, on === true)"
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
