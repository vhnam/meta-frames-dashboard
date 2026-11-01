<script setup lang="ts">
import { ScannerFormDialog, useScannerList } from "#/features/scanners";
import { computed, ref, watch } from "vue";
import { IconPlus } from "@tabler/icons-vue";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
import { Checkbox } from "#/shared/ui/checkbox";

/** The lab's scanners in order: the first is the default for a job sent there. */
const selected = defineModel<string[]>({ required: true });

const scanners = useScannerList();
/** Ticked scanners first, in their order, then the rest as the API lists them. */
const rows = computed(() => {
  const listed = scanners.data.value ?? [];
  const ticked = selected.value
    .map((scannerId) => listed.find((scanner) => scanner.id === scannerId))
    .filter((scanner) => !!scanner);
  return [...ticked, ...listed.filter((scanner) => !selected.value.includes(scanner.id))];
});

function toggle(scannerId: string, on: boolean) {
  selected.value = on
    ? [...selected.value, scannerId]
    : selected.value.filter((entry) => entry !== scannerId);
}

function makeDefault(scannerId: string) {
  selected.value = [scannerId, ...selected.value.filter((entry) => entry !== scannerId)];
}

const adding = ref(false);
/** A scanner added from here is ticked once the list holds it. */
const justAdded = ref<string>();
watch(
  () => scanners.data.value?.some((scanner) => scanner.id === justAdded.value),
  (listed) => {
    if (!listed || !justAdded.value) return;
    if (!selected.value.includes(justAdded.value)) toggle(justAdded.value, true);
    justAdded.value = undefined;
  },
);
</script>

<template>
  <fieldset class="grid min-w-0 gap-2">
    <legend class="sr-only">Scanners</legend>
    <p v-if="scanners.isPending.value" class="text-muted-foreground text-sm">Loading scanners…</p>
    <div
      v-for="scanner in rows"
      :key="scanner.id"
      class="dark:bg-input/30 flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-md border bg-white px-3 text-sm"
    >
      <label class="flex min-w-0 items-center gap-3">
        <Checkbox
          :model-value="selected.includes(scanner.id)"
          @update:model-value="(on) => toggle(scanner.id, on === true)"
        />
        <span class="truncate">{{ scanner.name }}</span>
        <span v-if="!scanner.builtIn" class="text-muted-foreground text-xs">Yours</span>
      </label>
      <Badge v-if="selected[0] === scanner.id" variant="secondary" class="shrink-0">Default</Badge>
      <Button
        v-else-if="selected.includes(scanner.id)"
        type="button"
        variant="ghost"
        size="sm"
        class="text-muted-foreground -mr-1.5 h-7 shrink-0 px-2 text-xs"
        @click="makeDefault(scanner.id)"
      >
        Make default
      </Button>
    </div>
    <div>
      <Button type="button" variant="ghost" size="sm" @click="adding = true">
        <IconPlus class="size-4" />
        Add a scanner this lab runs
      </Button>
    </div>
    <ScannerFormDialog v-model:open="adding" @saved="(scannerId) => (justAdded = scannerId)" />
  </fieldset>
</template>
