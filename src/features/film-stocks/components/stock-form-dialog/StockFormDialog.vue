<script setup lang="ts">
import { getInput, reset, setInput, useForm } from '@formisch/vue';
import type * as v from 'valibot';
import { computed, ref, watch } from 'vue';

import { countUnique } from '#/features/cameras/known';
import FormCombobox from '#/shared/components/form-combobox/FormCombobox.vue';
import FormInput from '#/shared/components/form-input/FormInput.vue';
import FormRichText from '#/shared/components/form-rich-text/FormRichText.vue';
import FormSection from '#/shared/components/form-section/FormSection.vue';
import FormSelect from '#/shared/components/form-select/FormSelect.vue';
import QuickPicks from '#/shared/components/quick-picks/QuickPicks.vue';
import SectionedFormDialog from '#/shared/components/sectioned-form-dialog/SectionedFormDialog.vue';
import { attempt } from '#/shared/lib/ui';
import { Button } from '#/shared/ui/button';

import { PROCESS_NAMES, stockName, stockWarnings } from '../../format';
import { useSaveStock, useStockList } from '../../queries';
import { StockSchema } from '../../schema';
import { FILM_TYPES, FILM_TYPE_LABELS, PACKAGINGS, PACKAGING_LABELS, PROCESSES } from '../../types';

const props = withDefaults(defineProps<{ stockId?: string; allowInlineBase?: boolean }>(), {
  allowInlineBase: true,
});
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ saved: [id: string] }>();

const stocks = useStockList();
const save = useSaveStock();
const form = useForm({
  schema: StockSchema,
  initialInput: { type: 'color', process: 'C-41', packaging: 'factory' },
});
const baseOpen = ref(false);

watch(open, (isOpen) => {
  if (!isOpen) return;
  const stock = stocks.data.value?.find((row) => row.stock.id === props.stockId)?.stock;
  reset(form, {
    initialInput: {
      brand: stock?.brand ?? '',
      name: stock?.name ?? '',
      type: stock?.type ?? 'color',
      boxIso: stock?.boxIso,
      process: stock?.process ?? 'C-41',
      packaging: stock?.packaging ?? 'factory',
      stockOrigin: stock?.stockOrigin ?? '',
      packOrigin: stock?.packOrigin ?? '',
      baseStockId: stock?.baseStockId ?? '',
      description: stock?.description ?? '',
    },
  });
});

const warnings = computed(() => {
  const input = getInput(form);
  return input.type && input.process
    ? stockWarnings({ type: input.type, process: input.process })
    : [];
});
const brands = computed(() => countUnique((stocks.data.value ?? []).map((row) => row.stock.brand)));
const baseOptions = computed(() =>
  (stocks.data.value ?? [])
    .filter((row) => row.stock.id !== props.stockId)
    .map((row) => ({ value: row.stock.id, label: stockName(row.stock) }))
    .sort((left, right) => left.label.localeCompare(right.label)),
);

// the picker reads "C-41 (Color negative)"
const typeOptions = FILM_TYPES.map((value) => ({ value, label: FILM_TYPE_LABELS[value] }));
const processOptions = PROCESSES.map((value) => ({
  value,
  label: `${value} (${PROCESS_NAMES[value]})`,
}));
const packagingOptions = PACKAGINGS.map((value) => ({ value, label: PACKAGING_LABELS[value] }));

const ISO_PICKS = [100, 200, 400, 800];
const boxIso = computed(() => Number(getInput(form, { path: ['boxIso'] })));
const pickIso = (iso: number) => setInput(form, { path: ['boxIso'], input: String(iso) });

const editing = computed(() => !!props.stockId);

async function submit(output: v.InferOutput<typeof StockSchema>) {
  const input = {
    ...output,
    stockOrigin: output.stockOrigin.trim(),
    packOrigin: output.packOrigin.trim(),
    description: output.description.trim(),
    baseStockId: output.baseStockId || null,
  };
  let id = props.stockId ?? '';
  const ok = await attempt(
    save.mutateAsync({ id: props.stockId, input }).then((saved) => (id = saved)),
  );
  if (ok) {
    open.value = false;
    emit('saved', id);
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
    <FormSection
      no="01"
      title="Primary specifications"
      note="* Required attributes"
    >
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormCombobox
          :of="form"
          :path="['brand']"
          label="Brand"
          required
          noun="brand"
          :options="brands"
          placeholder="Choose or type a brand"
        >
          <template #aside
            ><span class="text-xs text-muted-foreground">e.g. Kodak, Ilford</span></template
          >
        </FormCombobox>
        <FormInput
          :of="form"
          :path="['name']"
          label="Name"
          required
          placeholder="e.g. Portra 400"
        >
          <template #aside
            ><span class="text-xs text-muted-foreground">e.g. Portra 400</span></template
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
          suffix="ASA/ISO"
          placeholder="e.g. 400 or 100-400"
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
    <FormSection
      no="02"
      title="Chemistry & format"
      note="Standard lab process"
    >
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
      <p
        v-for="warning in warnings"
        :key="warning"
        class="rounded-md bg-status-warning-bg px-3 py-2 text-sm text-status-warning-fg"
      >
        {{ warning }}
      </p>
      <div class="rounded-lg border border-primary/15 bg-primary/5 p-5">
        <FormSelect
          :of="form"
          :path="['baseStockId']"
          label="Base stock"
          optional
          placeholder="None / original master emulsion"
          :options="baseOptions"
          hint="Original raw emulsion this film is repacked or re-spooled from (e.g. CineStill 800T is Vision3 500T)."
        >
          <template
            v-if="allowInlineBase"
            #aside
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="h-7 bg-card px-3 text-xs font-semibold text-primary hover:text-primary"
              @click="baseOpen = true"
            >
              + New base stock…
            </Button>
          </template>
        </FormSelect>
      </div>
    </FormSection>

    <!-- 03 -->
    <FormSection
      no="03"
      title="Provenance & archival notes"
      note="Origins & grain attributes"
    >
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
              <span class="text-xs text-muted-foreground">Markdown shortcuts work</span>
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
