<script setup lang="ts">
import { stockName, useStockList } from "#/features/film-stocks";
import { useUpdateRoll } from "../queries";
import { RollSchema } from "../schema";
import { FORMATS, MONTH_OPTIONS } from "../types";
import type { RollRow } from "../types";
import { getInput, reset, setInput, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, watch } from "vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import QuickPicks from "#/shared/components/QuickPicks.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{ row?: RollRow }>();
const open = defineModel<boolean>("open", { required: true });

const stocks = useStockList();
const update = useUpdateRoll();
const form = useForm({ schema: RollSchema });

watch(open, (isOpen) => {
  const roll = props.row?.roll;
  if (!isOpen || !roll) return;
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
});

const stockOptions = computed(() =>
  [...(stocks.data.value ?? [])]
    .sort((left, right) => stockName(left.stock).localeCompare(stockName(right.stock)))
    .map((row) => ({ value: row.stock.id, label: stockName(row.stock) })),
);
const formatOptions = FORMATS.map((format) => ({ value: format, label: format }));

const EXPOSURE_PICKS = [12, 24, 36];

async function submit(output: v.InferOutput<typeof RollSchema>) {
  if (!props.row) return;
  const ok = await attempt(
    update.mutateAsync({
      row: props.row,
      input: {
        ...output,
        price: output.price ?? null,
        expiryYear: output.expiryYear ?? null,
        expiryMonth: output.expiryMonth ?? null,
      },
    }),
  );
  if (ok) open.value = false;
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
    :pending="update.isPending.value"
    @submit="submit"
  >
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
