<script setup lang="ts">
import { stockName, useStockList } from "#/features/film-stocks";
import { useAddRolls } from "../queries";
import { AddRollsSchema } from "../schema";
import { FORMATS, MONTH_OPTIONS } from "../types";
import { getInput, reset, setInput, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, ref, watch } from "vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import QuickPicks from "#/shared/components/QuickPicks.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { Button } from "#/shared/ui/button";
import { attempt } from "#/shared/lib/ui";
import { StockFormDialog } from "#/features/film-stocks";

const props = defineProps<{ stockId?: string }>();
const open = defineModel<boolean>("open", { required: true });

const stocks = useStockList();
const addRolls = useAddRolls();
const form = useForm({
  schema: AddRollsSchema,
  initialInput: { format: "135", exposures: 36, quantity: 1 },
});
const stockOpen = ref(false);

watch(open, (isOpen) => {
  if (isOpen)
    reset(form, {
      initialInput: { stockId: props.stockId ?? "", format: "135", exposures: 36, quantity: 1 },
    });
});

const stockOptions = computed(() =>
  [...(stocks.data.value ?? [])]
    .sort((left, right) => stockName(left.stock).localeCompare(stockName(right.stock)))
    .map((row) => ({ value: row.stock.id, label: stockName(row.stock) })),
);
const formatOptions = FORMATS.map((format) => ({ value: format, label: format }));

const EXPOSURE_PICKS = [12, 24, 36];
const QUANTITY_PICKS = [1, 3, 5, 10];

/** Default exposures follow the format. */
watch(
  () => getInput(form, { path: ["format"] }),
  (format) => {
    if (format === "135") setInput(form, { path: ["exposures"], input: 36 });
    else if (format === "120") setInput(form, { path: ["exposures"], input: 12 });
  },
);

const quantity = computed(() => Number(getInput(form, { path: ["quantity"] })) || 1);

async function submit(output: v.InferOutput<typeof AddRollsSchema>) {
  const ok = await attempt(
    addRolls.mutateAsync({
      ...output,
      price: output.price ?? null,
      expiryYear: output.expiryYear ?? null,
      expiryMonth: output.expiryMonth ?? null,
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
    title="Add Rolls"
    description="One record per physical roll, from the same purchase"
    :submit-label="quantity === 1 ? 'Add roll' : `Add ${quantity} rolls`"
    :pending="addRolls.isPending.value"
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
          >
            <template #aside>
              <Button
                type="button"
                variant="outline"
                size="sm"
                class="bg-card text-primary hover:text-primary h-7 px-3 text-xs font-semibold"
                @click="stockOpen = true"
              >
                + New film stock…
              </Button>
            </template>
          </FormSelect>
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
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormInput
          :of="form"
          :path="['quantity']"
          label="Quantity"
          required
          type="number"
          min="1"
          step="1"
          suffix="rolls"
          placeholder="e.g. 1"
        >
          <template #aside>
            <QuickPicks
              :values="QUANTITY_PICKS"
              :current="getInput(form, { path: ['quantity'] })"
              label="Common quantities"
              @pick="(value) => setInput(form, { path: ['quantity'], input: value })"
            />
          </template>
        </FormInput>
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
      </div>
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

    <template #dialogs>
      <StockFormDialog
        v-if="stockOpen"
        v-model:open="stockOpen"
        @saved="(id) => setInput(form, { path: ['stockId'], input: id })"
      />
    </template>
  </SectionedFormDialog>
</template>
