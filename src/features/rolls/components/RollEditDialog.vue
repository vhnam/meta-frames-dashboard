<script setup lang="ts">
import { stockName, useStockList } from "#/features/film-stocks";
import { isRollChanged, rollQueries } from "../api";
import { rollChanges } from "../format";
import { useUpdateRoll } from "../queries";
import { RollSchema } from "../schema";
import { FORMATS, MONTH_OPTIONS } from "../types";
import type { Roll, RollRow } from "../types";
import { getInput, reset, setInput, useForm } from "@formisch/vue";
import { useQueryClient } from "@tanstack/vue-query";
import type * as v from "valibot";
import { computed, ref, shallowRef, watch } from "vue";
import { Button } from "#/shared/ui/button";
import FormInput from "#/shared/components/FormInput.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import QuickPicks from "#/shared/components/QuickPicks.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";

const props = defineProps<{ row?: RollRow }>();
const open = defineModel<boolean>("open", { required: true });

const stocks = useStockList();
const update = useUpdateRoll();
const queryClient = useQueryClient();
const form = useForm({ schema: RollSchema });

/**
 * The copy of the roll this edit is based on: its version goes out as If-Match and its fields
 * this form does not show are sent back unchanged. It moves only when the user picks a side
 * after the server refused a save because the roll had changed.
 */
const base = shallowRef<RollRow>();
/** The server's current roll after a refused save; null when it was deleted meanwhile. */
const latest = shallowRef<Roll | null>();
const reloading = ref(false);

function fill(roll: Roll) {
  reset(form, {
    initialInput: {
      stockId: roll.stockId,
      format: roll.format as (typeof FORMATS)[number],
      exposures: roll.exposures,
      price: roll.price ?? undefined,
      expiryYear: roll.expiryYear ?? undefined,
      expiryMonth: roll.expiryMonth ?? undefined,
    },
  });
}

watch(open, (isOpen) => {
  const row = props.row;
  if (!isOpen || !row) return;
  base.value = row;
  latest.value = undefined;
  fill(row.roll);
});

const stockOptions = computed(() =>
  [...(stocks.data.value ?? [])]
    .sort((left, right) => stockName(left.stock).localeCompare(stockName(right.stock)))
    .map((row) => ({ value: row.stock.id, label: stockName(row.stock) })),
);
const formatOptions = FORMATS.map((format) => ({ value: format, label: format }));

const EXPOSURE_PICKS = [12, 24, 36];

const stockLabel = (stockId: string) =>
  stockOptions.value.find((option) => option.value === stockId)?.label ?? "Unknown stock";
const changes = computed(() =>
  base.value && latest.value ? rollChanges(base.value.roll, latest.value, stockLabel) : [],
);

async function submit(output: v.InferOutput<typeof RollSchema>) {
  const row = base.value;
  if (!row || latest.value !== undefined) return;
  try {
    await update.mutateAsync({
      row,
      input: {
        ...output,
        price: output.price ?? null,
        expiryYear: output.expiryYear ?? null,
        expiryMonth: output.expiryMonth ?? null,
      },
    });
    open.value = false;
  } catch (error) {
    // failures are toasted centrally; a changed roll also needs the user to decide what to keep
    if (isRollChanged(error)) await showLatest(row.roll.id);
  }
}

/** Reads the server's current roll, leaving what the user typed in the form untouched. */
async function showLatest(rollId: string) {
  reloading.value = true;
  try {
    const detail = await queryClient.fetchQuery({ ...rollQueries.detail(rollId), staleTime: 0 });
    latest.value = detail?.roll ?? null;
  } finally {
    reloading.value = false;
  }
}

/** Keeps the user's edits; the next Save applies them on top of the current server values. */
function keepMine() {
  if (!base.value || !latest.value) return;
  base.value = { ...base.value, roll: latest.value };
  latest.value = undefined;
}

/** Drops the user's edits and shows the current server values. */
function useLatest() {
  if (!base.value || !latest.value) return;
  base.value = { ...base.value, roll: latest.value };
  fill(latest.value);
  latest.value = undefined;
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    title="Edit Roll"
    description="Update the film, purchase price and expiry of this roll"
    submit-label="Save changes"
    :pending="update.isPending.value || reloading || latest !== undefined"
    @submit="submit"
  >
    <section
      v-if="latest !== undefined"
      role="alert"
      class="border-destructive/40 bg-destructive/5 grid gap-4 rounded-md border p-4"
    >
      <template v-if="latest">
        <p class="text-sm">
          This roll was changed after you opened it, so nothing was saved. Your edits are still in
          the form. Compare, then choose what to keep.
        </p>
        <table v-if="changes.length" class="w-full text-sm">
          <thead class="text-muted-foreground text-left text-xs">
            <tr>
              <th class="py-1 pr-3 font-medium">Field</th>
              <th class="py-1 pr-3 font-medium">When you opened it</th>
              <th class="py-1 font-medium">Now</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="change in changes" :key="change.label" class="border-t">
              <td class="py-1 pr-3">{{ change.label }}</td>
              <td class="py-1 pr-3">{{ change.before }}</td>
              <td class="py-1 font-medium">{{ change.now }}</td>
            </tr>
          </tbody>
        </table>
        <div class="flex flex-wrap gap-3">
          <Button type="button" variant="outline" @click="useLatest">Use the current values</Button>
          <Button type="button" @click="keepMine">Keep my edits</Button>
        </div>
      </template>
      <p v-else class="text-sm">This roll was deleted after you opened it, so nothing was saved.</p>
    </section>
    <FormSection no="01" title="Film" note="* Required attributes">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <FormSelect
            :of="form"
            :path="['stockId']"
            label="Film stock"
            required
            placeholder="Select film stock"
            :options="stockOptions"
          />
        </div>
        <FormSelect
          :of="form"
          :path="['format']"
          label="Format"
          required
          placeholder="Select format"
          :options="formatOptions"
        />
        <FormInput
          :of="form"
          :path="['exposures']"
          label="Exposures"
          required
          type="number"
          min="1"
          step="1"
          placeholder="e.g. 36"
        >
          <template #aside>
            <QuickPicks
              :values="EXPOSURE_PICKS"
              :current="getInput(form, { path: ['exposures'] })"
              label="Common exposure counts"
              @pick="(value) => setInput(form, { path: ['exposures'], input: value })"
            />
          </template>
        </FormInput>
      </div>
    </FormSection>

    <FormSection no="02" title="Purchase" note="Shipping excluded">
      <FormInput
        :of="form"
        :path="['price']"
        label="Unit price"
        optional
        type="number"
        min="0"
        step="1000"
        suffix="₫ / roll"
        placeholder="e.g. 150000"
      />
    </FormSection>

    <FormSection no="03" title="Expiry" note="As printed on the box">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormInput
          :of="form"
          :path="['expiryYear']"
          label="Expiry year"
          optional
          type="number"
          min="1900"
          step="1"
          placeholder="e.g. 2027"
        />
        <FormSelect
          :of="form"
          :path="['expiryMonth']"
          label="Expiry month"
          optional
          numeric
          placeholder="Select month"
          :options="MONTH_OPTIONS"
        />
      </div>
    </FormSection>
  </SectionedFormDialog>
</template>
