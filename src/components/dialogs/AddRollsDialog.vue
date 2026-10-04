<script setup lang="ts">
import { reset, setInput, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, ref, watch } from "vue";
import FormDialog from "#/components/common/FormDialog.vue";
import FormInput from "#/components/common/FormInput.vue";
import FormSelect from "#/components/common/FormSelect.vue";
import { Button } from "#/components/ui/button";
import { useAddRolls, useStockList } from "#/api";
import { stockName } from "#/domain/format";
import { AddRollsSchema } from "#/domain/schemas";
import { FORMATS } from "#/domain/types";
import { attempt } from "#/lib/ui";
import StockFormDialog from "./StockFormDialog.vue";

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
    .sort((a, b) => stockName(a.stock).localeCompare(stockName(b.stock)))
    .map((r) => ({ value: r.stock.id, label: stockName(r.stock) })),
);

/** Default exposures follow the format. */
function onFormatChange(format: string) {
  if (format === "135") setInput(form, { path: ["exposures"], input: 36 });
  else if (format === "120") setInput(form, { path: ["exposures"], input: 12 });
}

async function submit(o: v.InferOutput<typeof AddRollsSchema>) {
  const ok = await attempt(
    addRolls.mutateAsync({
      ...o,
      price: o.price ?? null,
      expiryYear: o.expiryYear ?? null,
      expiryMonth: o.expiryMonth ?? null,
    }),
  );
  if (ok) open.value = false;
}
</script>

<template>
  <FormDialog
    v-model:open="open"
    :form="form"
    title="Add rolls"
    description="One record per physical roll."
    @submit="submit"
  >
    <FormSelect
      :of="form"
      :path="['stockId']"
      label="Film stock"
      placeholder="Select stock…"
      :options="stockOptions"
    >
      <template #action>
        <Button type="button" variant="outline" @click="stockOpen = true">New…</Button>
      </template>
    </FormSelect>
    <div class="grid grid-cols-3 gap-3">
      <div @change="(e) => onFormatChange((e.target as HTMLSelectElement).value)">
        <FormSelect
          :of="form"
          :path="['format']"
          label="Format"
          :options="FORMATS.map((f) => ({ value: f, label: f }))"
        />
      </div>
      <FormInput
        :of="form"
        :path="['exposures']"
        label="Exposures"
        type="number"
        min="1"
        placeholder="e.g. 36"
      />
      <FormInput
        :of="form"
        :path="['quantity']"
        label="Quantity"
        type="number"
        min="1"
        placeholder="e.g. 1"
      />
    </div>
    <FormInput
      :of="form"
      :path="['price']"
      label="Unit price (₫)"
      optional
      type="number"
      min="0"
      hint="Per roll, shipping excluded."
      placeholder="e.g. 150000"
    />
    <div class="grid grid-cols-2 gap-3">
      <FormInput
        :of="form"
        :path="['expiryYear']"
        label="Expiry year"
        optional
        type="number"
        min="1900"
        placeholder="e.g. 2027"
      />
      <FormInput
        :of="form"
        :path="['expiryMonth']"
        label="Expiry month"
        optional
        type="number"
        min="1"
        max="12"
        placeholder="e.g. 6"
      />
    </div>
    <StockFormDialog
      v-if="stockOpen"
      v-model:open="stockOpen"
      @saved="(id) => setInput(form, { path: ['stockId'], input: id })"
    />
  </FormDialog>
</template>
