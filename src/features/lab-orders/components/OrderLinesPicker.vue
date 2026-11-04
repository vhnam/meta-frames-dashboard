<script setup lang="ts">
import { roomOnLine } from "../types";
import type { LabOrderLine } from "../types";
import { computed } from "vue";
import { Checkbox } from "#/shared/ui/checkbox";
import { formatVnd } from "#/shared/lib/format";

const props = defineProps<{
  lines: LabOrderLine[];
  /** Lines the job is already on: they count as having room for it. */
  ownLineIds?: string[];
  error?: string;
}>();
/** The ticked lines: one roll can be billed on several, such as developing and scanning. */
const selected = defineModel<string[]>({ required: true });

const isFull = (line: LabOrderLine) =>
  roomOnLine(line) <= 0 && !props.ownLineIds?.includes(line.id);
const rollPrice = computed(() =>
  props.lines
    .filter((line) => selected.value.includes(line.id))
    .reduce((sum, line) => sum + line.unitCost, 0),
);

function toggle(lineId: string, on: boolean) {
  selected.value = on
    ? [...selected.value, lineId]
    : selected.value.filter((entry) => entry !== lineId);
}
</script>

<template>
  <fieldset class="grid min-w-0 gap-2">
    <legend class="font-heading mb-2 text-sm font-medium">Order lines</legend>
    <div class="overflow-x-auto rounded-md border">
      <table class="dark:bg-input/30 w-full min-w-md bg-white text-sm">
        <thead class="bg-muted/50">
          <tr class="text-muted-foreground text-left text-xs">
            <th scope="col" class="w-10 px-3 py-2"><span class="sr-only">Bill this roll</span></th>
            <th scope="col" class="px-3 py-2 font-medium">Product</th>
            <th scope="col" class="w-32 px-3 py-2 text-right font-medium">Price with VAT</th>
          </tr>
        </thead>
        <tbody class="divide-y border-t">
          <tr v-for="line in lines" :key="line.id" :class="isFull(line) && 'opacity-60'">
            <td class="px-3 py-2.5 align-middle">
              <Checkbox
                :id="`order-line-${line.id}`"
                :model-value="selected.includes(line.id)"
                :disabled="isFull(line) && !selected.includes(line.id)"
                :aria-label="`Bill this roll on ${line.product}`"
                @update:model-value="(on) => toggle(line.id, on === true)"
              />
            </td>
            <td class="px-3 py-2.5">
              <label :for="`order-line-${line.id}`" class="block font-medium">
                {{ line.product }}
                <span class="text-muted-foreground font-normal tabular-nums">
                  ({{ line.jobs.length }} of {{ line.quantity }})
                </span>
              </label>
            </td>
            <td class="px-3 py-2.5 text-right tabular-nums">{{ formatVnd(line.unitCost) }}</td>
          </tr>
        </tbody>
        <tfoot class="border-t">
          <tr>
            <th scope="row" colspan="2" class="px-3 py-2.5 text-right font-medium">Roll price</th>
            <td class="px-3 py-2.5 text-right font-semibold tabular-nums">
              {{ formatVnd(rollPrice) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
    <p v-if="error" class="text-destructive text-sm">{{ error }}</p>
  </fieldset>
</template>
