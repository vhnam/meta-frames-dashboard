<script setup lang="ts">
import { ScannerFormDialog, useScannerList } from "#/features/scanners";
import { computed, ref, watch } from "vue";
import { IconPlus } from "@tabler/icons-vue";
import { Button } from "#/shared/ui/button";
import { Checkbox } from "#/shared/ui/checkbox";
import { Switch } from "#/shared/ui/switch";

/** The lab's scanners in order. */
const selected = defineModel<string[]>({ required: true });
/** The scanner a job sent there starts with, if any. */
const defaultId = defineModel<string>("defaultId");

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
  if (!on && defaultId.value === scannerId) defaultId.value = undefined;
  selected.value = on
    ? [...selected.value, scannerId]
    : selected.value.filter((entry) => entry !== scannerId);
}

/** The default moves to the top of the lab's scanners; switching it off leaves no default. */
function setDefault(scannerId: string, on: boolean) {
  if (!on) {
    defaultId.value = undefined;
    return;
  }
  selected.value = [scannerId, ...selected.value.filter((entry) => entry !== scannerId)];
  defaultId.value = scannerId;
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
      <label
        v-if="selected.includes(scanner.id)"
        class="text-muted-foreground flex shrink-0 items-center gap-2 text-xs"
      >
        Default
        <Switch
          :model-value="defaultId === scanner.id"
          @update:model-value="(on: boolean) => setDefault(scanner.id, on)"
        />
      </label>
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
