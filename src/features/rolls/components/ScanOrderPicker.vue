<script setup lang="ts">
import {
  ScanSettingsFields,
  ScannerFormDialog,
  describeSettings,
  optionsForKind,
  startingSettings,
  useScannerKinds,
  useScannerList,
} from "#/features/scanners";
import type { ScanSettings, ScannerKind } from "#/features/scanners";
import type { ScanOrder } from "../types";
import { computed, ref, watch } from "vue";
import { IconAdjustmentsHorizontal, IconChevronDown, IconPlus } from "@tabler/icons-vue";
import { Button } from "#/shared/ui/button";
import { Checkbox } from "#/shared/ui/checkbox";

const props = defineProps<{
  error?: string;
  /** Scanners that already have imported scans: they cannot be unticked. */
  locked?: string[];
  /** Names of scanners on the job, for one missing from the list. */
  names?: Record<string, string>;
  /** Scanners the chosen lab runs, the default first; empty offers every scanner. */
  offered?: string[];
}>();
const orders = defineModel<ScanOrder[]>({ required: true });

const scanners = useScannerList();
const kinds = useScannerKinds();

interface Row {
  id: string;
  name: string;
  builtIn: boolean;
  kind: ScannerKind | null;
  defaultSettings: ScanSettings;
}
/** Every scanner of the lab is shown; the others wait behind "Show all scanners". */
const showAll = ref(false);
const offeredOnly = computed(() => !!props.offered?.length && !showAll.value);
/**
 * The lab's scanners in its order (or every scanner the account can use), plus any ordered one
 * not among them.
 */
const rows = computed((): Row[] => {
  const all = scanners.data.value ?? [];
  const listed = offeredOnly.value
    ? props
        .offered!.map((scannerId) => all.find((scanner) => scanner.id === scannerId))
        .filter((scanner) => !!scanner)
    : all;
  const known = new Set(listed.map((scanner) => scanner.id));
  const extra = orders.value
    .filter((order) => !known.has(order.scannerId))
    .map(
      (order): Row =>
        all.find((scanner) => scanner.id === order.scannerId) ?? {
          id: order.scannerId,
          name: props.names?.[order.scannerId] ?? "Scanner",
          builtIn: false,
          kind: null,
          defaultSettings: {},
        },
    );
  return [...listed, ...extra];
});

const find = (scannerId: string) => orders.value.find((order) => order.scannerId === scannerId);
const optionsOf = (row: Row) => optionsForKind(kinds.data.value, row.kind);

function toggle(row: Row, on: boolean) {
  orders.value = on
    ? [...orders.value, { scannerId: row.id, settings: startingSettings(kinds.data.value, row) }]
    : orders.value.filter((order) => order.scannerId !== row.id);
}

function setSettings(scannerId: string, settings: ScanSettings) {
  orders.value = orders.value.map((order) =>
    order.scannerId === scannerId ? { ...order, settings } : order,
  );
}

/** Settings are folded away under a one-line summary until opened. */
const expanded = ref(new Set<string>());
function flip(scannerId: string) {
  const next = new Set(expanded.value);
  if (next.has(scannerId)) next.delete(scannerId);
  else next.add(scannerId);
  expanded.value = next;
}

const adding = ref(false);
/** A scanner added from here is ordered straight away, once the list holds it. */
const justAdded = ref<string>();
function added(scannerId: string) {
  justAdded.value = scannerId;
}
// the new scanner reaches the list after the save refetches it, with its kind and defaults
watch(
  () => rows.value.find((row) => row.id === justAdded.value),
  (row) => {
    if (!row) return;
    if (!find(row.id)) toggle(row, true);
    justAdded.value = undefined;
  },
);
</script>

<template>
  <fieldset class="grid min-w-0 gap-2">
    <legend class="font-heading mb-1 text-sm font-medium">Scanners</legend>
    <p v-if="scanners.isPending.value" class="text-muted-foreground text-sm">Loading scanners…</p>
    <div
      v-for="scanner in rows"
      :key="scanner.id"
      class="dark:bg-input/30 min-w-0 rounded-md border bg-white text-sm"
    >
      <div class="flex min-h-11 items-center justify-between gap-3 px-3">
        <label class="flex min-w-0 shrink-0 items-center gap-3">
          <Checkbox
            :model-value="!!find(scanner.id)"
            :disabled="props.locked?.includes(scanner.id)"
            @update:model-value="(on) => toggle(scanner, on === true)"
          />
          <span class="truncate">{{ scanner.name }}</span>
          <span v-if="!scanner.builtIn" class="text-muted-foreground text-xs">Yours</span>
        </label>
        <button
          v-if="find(scanner.id)"
          type="button"
          class="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground -mr-1.5 flex min-w-0 items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs outline-none hover:border-border focus-visible:ring-3"
          :aria-expanded="expanded.has(scanner.id)"
          :aria-controls="`order-settings-${scanner.id}`"
          :title="describeSettings(find(scanner.id)!.settings, optionsOf(scanner))"
          @click="flip(scanner.id)"
        >
          <IconAdjustmentsHorizontal class="size-3.5 shrink-0" aria-hidden="true" />
          <span class="truncate">
            {{ describeSettings(find(scanner.id)!.settings, optionsOf(scanner)) }}
          </span>
          <IconChevronDown
            class="size-3.5 shrink-0 transition-transform"
            :class="expanded.has(scanner.id) ? 'rotate-180' : undefined"
            aria-hidden="true"
          />
        </button>
      </div>
      <div
        v-if="find(scanner.id) && expanded.has(scanner.id)"
        :id="`order-settings-${scanner.id}`"
        class="border-t px-3 py-3"
      >
        <ScanSettingsFields
          :model-value="find(scanner.id)!.settings"
          :options="optionsOf(scanner)"
          :id-prefix="`order-${scanner.id}`"
          @update:model-value="(settings) => setSettings(scanner.id, settings)"
        />
      </div>
    </div>
    <div class="flex flex-wrap gap-1">
      <Button
        v-if="props.offered?.length"
        type="button"
        variant="ghost"
        size="sm"
        @click="showAll = !showAll"
      >
        {{ showAll ? "Only this lab's scanners" : "Show all scanners" }}
      </Button>
      <Button type="button" variant="ghost" size="sm" @click="adding = true">
        <IconPlus class="size-4" />
        Add a scanner of your own
      </Button>
    </div>
    <p v-if="props.locked?.length" class="text-muted-foreground text-xs">
      A scanner with imported scans cannot be removed.
    </p>
    <p v-if="props.error" class="text-destructive text-xs">{{ props.error }}</p>
    <ScannerFormDialog v-model:open="adding" @saved="added" />
  </fieldset>
</template>
