<script setup lang="ts">
import { ref, watch } from "vue";
import type { RollJob } from "#/features/rolls";
import { Button } from "#/shared/ui/button";
import { Input } from "#/shared/ui/input";
import { Label } from "#/shared/ui/label";
import PlainDialog from "#/shared/components/PlainDialog.vue";
import { useFrameComparison } from "../queries";
import ScanImage from "./ScanImage.vue";

const props = defineProps<{ job: RollJob }>();
const open = defineModel<boolean>("open", { required: true });

const typed = ref<string | number>("");
/** The frame being compared; set when the user asks for one. */
const frame = ref<number>();
const comparison = useFrameComparison(
  () => props.job.id,
  () => (open.value ? frame.value : undefined),
);

watch(open, (isOpen) => {
  if (!isOpen) return;
  typed.value = "";
  frame.value = undefined;
});

function show(number: number | null | undefined) {
  if (number === null || number === undefined) return;
  frame.value = number;
  typed.value = String(number);
}

function submit() {
  // a number input hands back a number once the user types, a string before
  const text = String(typed.value).trim();
  const number = Number(text);
  if (text && Number.isInteger(number) && number >= 0) frame.value = number;
}
</script>

<template>
  <PlainDialog
    v-model:open="open"
    title="Compare scans"
    description="Every scanner's scan of one frame, side by side"
    submit-label="Show frame"
    wide
    @submit="submit"
  >
    <div class="grid gap-1.5">
      <Label class="text-sm font-medium" for="compare-frame">Frame number</Label>
      <Input id="compare-frame" v-model="typed" type="number" min="0" />
    </div>

    <p v-if="comparison.isError.value" class="text-destructive text-sm" role="alert">
      {{ comparison.error.value?.message }}
    </p>
    <section v-else-if="comparison.data.value" class="grid gap-3" aria-label="Comparison">
      <div class="flex items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          :disabled="comparison.data.value.previousFrameNumber === null"
          @click="show(comparison.data.value.previousFrameNumber)"
        >
          Previous frame
        </Button>
        <p class="font-medium tabular-nums">Frame {{ comparison.data.value.frameNumber }}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          :disabled="comparison.data.value.nextFrameNumber === null"
          @click="show(comparison.data.value.nextFrameNumber)"
        >
          Next frame
        </Button>
      </div>
      <p v-if="!comparison.data.value.scans.length" class="text-muted-foreground text-sm">
        No scans of this frame yet.
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <figure v-for="scan in comparison.data.value.scans" :key="scan.id" class="grid gap-1.5">
          <ScanImage :scan-id="scan.id" :alt="`${scan.scannerName}, frame ${scan.frameNumber}`" />
          <figcaption class="text-muted-foreground text-xs">
            {{ scan.scannerName }} · {{ scan.fileName }}
          </figcaption>
        </figure>
      </div>
    </section>
  </PlainDialog>
</template>
