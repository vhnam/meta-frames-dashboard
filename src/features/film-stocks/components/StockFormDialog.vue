<script setup lang="ts">
import { PROCESS_NAMES, stockName, stockWarnings } from "../format";
import { useSaveStock, useStockList } from "../queries";
import { StockSchema } from "../schema";
import { FILM_TYPES, FILM_TYPE_LABELS, PACKAGINGS, PACKAGING_LABELS, PROCESSES } from "../types";
import { getInput, reset, setInput, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, ref, watch } from "vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormRichText from "#/shared/components/FormRichText.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import FormSection from "#/shared/components/FormSection.vue";
import QuickPicks from "#/shared/components/QuickPicks.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
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
  initialInput: { type: "color", process: "C-41", packaging: "factory" },
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
      boxIso: s?.boxIso,
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

// the picker reads "C-41 (Color negative)"
const typeOptions = FILM_TYPES.map((value) => ({ value, label: FILM_TYPE_LABELS[value] }));
const processOptions = PROCESSES.map((value) => ({
  value,
  label: `${value} (${PROCESS_NAMES[value]})`,
}));
const packagingOptions = PACKAGINGS.map((value) => ({ value, label: PACKAGING_LABELS[value] }));

const ISO_PICKS = [100, 200, 400, 800];
const boxIso = computed(() => Number(getInput(form, { path: ["boxIso"] })));
const pickIso = (iso: number) => setInput(form, { path: ["boxIso"], input: iso });

const editing = computed(() => !!props.stockId);

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
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    :title="editing ? 'Edit Film Stock' : 'Add Film Stock'"
    :description="
      editing
        ? 'Update the emulsion, format and processing standard'
        : 'Register a new master emulsion, format, and processing standard'
    "
    :submit-label="editing ? 'Save changes' : 'Register film stock'"
    :pending="save.isPending.value"
    @submit="submit"
  >
    <!-- 01 -->
    <FormSection no="01" title="Primary specifications" note="* Required attributes">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormInput :of="form" :path="['brand']" label="Brand" required placeholder="e.g. Kodak">
          <template #aside
            ><span class="text-muted-foreground text-xs">e.g. Kodak, Ilford</span></template
          >
        </FormInput>
        <FormInput :of="form" :path="['name']" label="Name" required placeholder="e.g. Portra 400">
          <template #aside
            ><span class="text-muted-foreground text-xs">e.g. Portra 400</span></template
          >
        </FormInput>
        <FormSelect
          :of="form"
          :path="['type']"
          label="Type"
          required
          :options="typeOptions"
          placeholder="Select type"
        />
        <FormInput
          :of="form"
          :path="['boxIso']"
          label="Box ISO"
          required
          type="number"
          min="1"
          suffix="ASA/ISO"
          placeholder="e.g. 400"
        >
          <template #aside>
            <QuickPicks
              :values="ISO_PICKS"
              :current="boxIso"
              label="Common box speeds"
              @pick="pickIso"
            />
          </template>
        </FormInput>
      </div>
    </FormSection>

    <!-- 02 -->
    <FormSection no="02" title="Chemistry & format" note="Standard lab process">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormSelect
          :of="form"
          :path="['process']"
          label="Process"
          required
          :options="processOptions"
          placeholder="Select process"
        />
        <FormSelect
          :of="form"
          :path="['packaging']"
          label="Packaging"
          required
          :options="packagingOptions"
          placeholder="Select packaging"
        />
      </div>
      <p v-for="w in warnings" :key="w" class="text-sm text-amber-600">{{ w }}</p>
      <div class="border-primary/15 bg-primary/5 rounded-lg border p-5">
        <FormSelect
          :of="form"
          :path="['baseStockId']"
          label="Base stock"
          optional
          placeholder="None / original master emulsion"
          :options="baseOptions"
          hint="Original raw emulsion this film is repacked or re-spooled from (e.g. CineStill 800T is Vision3 500T)."
        >
          <template v-if="allowInlineBase" #aside>
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="bg-card text-primary hover:text-primary h-7 px-3 text-xs font-semibold"
              @click="baseOpen = true"
            >
              + New base stock…
            </Button>
          </template>
        </FormSelect>
      </div>
    </FormSection>

    <!-- 03 -->
    <FormSection no="03" title="Provenance & archival notes" note="Origins & grain attributes">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormInput
          :of="form"
          :path="['stockOrigin']"
          label="Stock origin"
          optional
          placeholder="e.g. Rochester, USA"
        />
        <FormInput
          :of="form"
          :path="['packOrigin']"
          label="Pack origin"
          optional
          hint="Usually empty for factory sealed packaging."
          placeholder="e.g. CineStill Inc., USA"
        />
        <div class="sm:col-span-2">
          <FormRichText
            :of="form"
            :path="['description']"
            label="Darkroom notes & characteristics"
            optional
            placeholder="Add development dilution notes, grain profiles, color latitude, halation characteristics, push/pull behavior…"
          >
            <template #aside>
              <span class="text-muted-foreground text-xs">Markdown shortcuts work</span>
            </template>
          </FormRichText>
        </div>
      </div>
    </FormSection>
    <template #dialogs>
      <StockFormDialog
        v-if="allowInlineBase && baseOpen"
        v-model:open="baseOpen"
        :allow-inline-base="false"
        @saved="(id) => setInput(form, { path: ['baseStockId'], input: id })"
      />
    </template>
  </SectionedFormDialog>
</template>
