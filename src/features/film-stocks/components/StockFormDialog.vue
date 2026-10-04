<script setup lang="ts">
import { stockName, stockWarnings } from "../format";
import { useSaveStock, useStockList } from "../queries";
import { StockSchema } from "../schema";
import { FILM_TYPES, FILM_TYPE_LABELS, PACKAGINGS, PACKAGING_LABELS, PROCESSES } from "../types";
import { getInput, reset, setInput, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, ref, watch } from "vue";
import FormDialog from "#/shared/components/FormDialog.vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import { Button } from "#/shared/ui/button";
import { attempt } from "#/shared/lib/ui";

const props = withDefaults(defineProps<{ stockId?: string; allowInlineBase?: boolean }>(), {
  allowInlineBase: true,
});
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [id: string] }>();

const stocks = useStockList();
const save = useSaveStock();
const form = useForm({
  schema: StockSchema,
  initialInput: { type: "color", process: "C-41", packaging: "factory", boxIso: 400 },
});
const baseOpen = ref(false);

watch(open, (isOpen) => {
  if (!isOpen) return;
  const s = stocks.data.value?.find((r) => r.stock.id === props.stockId)?.stock;
  reset(form, {
    initialInput: {
      brand: s?.brand ?? "",
      name: s?.name ?? "",
      type: s?.type ?? "color",
      boxIso: s?.boxIso ?? 400,
      process: s?.process ?? "C-41",
      packaging: s?.packaging ?? "factory",
      stockOrigin: s?.stockOrigin ?? "",
      packOrigin: s?.packOrigin ?? "",
      baseStockId: s?.baseStockId ?? "",
      description: s?.description ?? "",
    },
  });
});

const warnings = computed(() => {
  const input = getInput(form);
  return input.type && input.process
    ? stockWarnings({ type: input.type, process: input.process })
    : [];
});
const baseOptions = computed(() =>
  (stocks.data.value ?? [])
    .filter((r) => r.stock.id !== props.stockId)
    .map((r) => ({ value: r.stock.id, label: stockName(r.stock) }))
    .sort((a, b) => a.label.localeCompare(b.label)),
);
const typeOptions = FILM_TYPES.map((value) => ({ value, label: FILM_TYPE_LABELS[value] }));
const packagingOptions = PACKAGINGS.map((value) => ({ value, label: PACKAGING_LABELS[value] }));
const opt = (xs: readonly string[]) => xs.map((x) => ({ value: x, label: x }));

async function submit(o: v.InferOutput<typeof StockSchema>) {
  const input = {
    ...o,
    stockOrigin: o.stockOrigin.trim(),
    packOrigin: o.packOrigin.trim(),
    description: o.description.trim(),
    baseStockId: o.baseStockId || null,
  };
  let id = props.stockId ?? "";
  const ok = await attempt(
    save.mutateAsync({ id: props.stockId, input }).then((saved) => (id = saved)),
  );
  if (ok) {
    open.value = false;
    emit("saved", id);
  }
}
</script>

<template>
  <FormDialog
    v-model:open="open"
    :form="form"
    :title="stockId ? 'Edit film stock' : 'Add film stock'"
    wide
    @submit="submit"
  >
    <div class="grid gap-6 sm:grid-cols-2">
      <FormInput :of="form" :path="['brand']" label="Brand" placeholder="e.g. Nikon" />
      <FormInput :of="form" :path="['name']" label="Name" placeholder="e.g. Portra 400" />
      <FormSelect
        :of="form"
        :path="['type']"
        label="Type"
        :options="typeOptions"
        placeholder="Select type"
      />
      <FormInput
        :of="form"
        :path="['boxIso']"
        label="Box ISO"
        type="number"
        min="1"
        placeholder="e.g. 400"
      />
      <FormSelect
        :of="form"
        :path="['process']"
        label="Process"
        :options="opt(PROCESSES)"
        placeholder="Select process"
      />
      <FormSelect
        :of="form"
        :path="['packaging']"
        label="Packaging"
        :options="packagingOptions"
        placeholder="Select packaging"
      />
      <FormInput
        :of="form"
        :path="['stockOrigin']"
        label="Stock origin"
        optional
        placeholder="e.g. USA"
      />
      <FormInput
        :of="form"
        :path="['packOrigin']"
        label="Pack origin"
        optional
        hint="Usually empty for factory packaging."
        placeholder="e.g. Respool Co."
      />
      <div class="space-y-6 sm:col-span-2">
        <FormSelect
          :of="form"
          :path="['baseStockId']"
          label="Base stock"
          optional
          placeholder="None / unknown"
          :options="baseOptions"
          hint="Original emulsion this film is repacked or re-spooled from."
        >
          <template v-if="allowInlineBase" #action>
            <Button type="button" variant="outline" @click="baseOpen = true">New…</Button>
          </template>
        </FormSelect>
        <FormInput
          :of="form"
          :path="['description']"
          label="Description"
          optional
          multiline
          placeholder="Add a description"
        />
      </div>
    </div>

    <p v-for="w in warnings" :key="w" class="text-sm text-amber-600">{{ w }}</p>

    <StockFormDialog
      v-if="allowInlineBase && baseOpen"
      v-model:open="baseOpen"
      :allow-inline-base="false"
      @saved="(id) => setInput(form, { path: ['baseStockId'], input: id })"
    />
  </FormDialog>
</template>
