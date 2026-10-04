<script setup lang="ts">
import { stockName, useStockList } from "#/features/film-stocks";
import { useUpdateRoll } from "../queries";
import { RollSchema } from "../schema";
import { FORMATS, MONTH_OPTIONS } from "../types";
import type { RollRow } from "../types";
import { reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, watch } from "vue";
import FormDialog from "#/shared/components/FormDialog.vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{ row?: RollRow }>();
const open = defineModel<boolean>("open", { required: true });

const stocks = useStockList();
const update = useUpdateRoll();
const form = useForm({ schema: RollSchema });

watch(open, (isOpen) => {
  const r = props.row?.roll;
  if (!isOpen || !r) return;
  reset(form, {
    initialInput: {
      stockId: r.stockId,
      format: r.format as (typeof FORMATS)[number],
      exposures: r.exposures,
      price: r.price ?? undefined,
      expiryYear: r.expiryYear ?? undefined,
      expiryMonth: r.expiryMonth ?? undefined,
    },
  });
});

const stockOptions = computed(() =>
  (stocks.data.value ?? []).map((r) => ({ value: r.stock.id, label: stockName(r.stock) })),
);

async function submit(o: v.InferOutput<typeof RollSchema>) {
  if (!props.row) return;
  const ok = await attempt(
    update.mutateAsync({
      row: props.row,
      input: {
        ...o,
        price: o.price ?? null,
        expiryYear: o.expiryYear ?? null,
        expiryMonth: o.expiryMonth ?? null,
      },
    }),
  );
  if (ok) open.value = false;
}
</script>

<template>
  <FormDialog v-model:open="open" :form="form" title="Edit roll" @submit="submit">
    <FormSelect
      :of="form"
      :path="['stockId']"
      label="Film stock"
      placeholder="Select film stock"
      :options="stockOptions"
    />
    <div class="grid grid-cols-2 gap-3">
      <FormSelect
        :of="form"
        :path="['format']"
        label="Format"
        placeholder="Select format"
        :options="FORMATS.map((f) => ({ value: f, label: f }))"
      />
      <FormInput
        :of="form"
        :path="['exposures']"
        label="Exposures"
        type="number"
        min="1"
        placeholder="e.g. 36"
      />
    </div>
    <FormInput
      :of="form"
      :path="['price']"
      label="Price (₫)"
      optional
      type="number"
      min="0"
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
  </FormDialog>
</template>
