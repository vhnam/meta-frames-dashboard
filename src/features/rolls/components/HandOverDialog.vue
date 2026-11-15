<script setup lang="ts">
import { getInput, reset, useForm } from '@formisch/vue';
import type * as v from 'valibot';
import { computed, ref, watch } from 'vue';

import { useLabList } from '#/features/labs';
import {
  NORITSU_HS1800,
  startingSettings,
  useScannerKinds,
  useScannerList,
} from '#/features/scanners';
import FormInput from '#/shared/components/form-input/FormInput.vue';
import FormSection from '#/shared/components/form-section/FormSection.vue';
import FormSelect from '#/shared/components/form-select/FormSelect.vue';
import SectionedFormDialog from '#/shared/components/sectioned-form-dialog/SectionedFormDialog.vue';
import Select from '#/shared/components/select/Select.vue';
import { attempt } from '#/shared/lib/ui';

import { useHandOverRolls } from '../queries';
import { handOverType, handOverTypes } from '../rollList';
import { HandOverSchema } from '../schema';
import { PROCESSING_TYPE_LABELS, producesScans } from '../types';
import type { ProcessingType, RollListRow, ScanOrder } from '../types';
import ScanOrderPicker from './ScanOrderPicker.vue';

const props = defineProps<{ rows: RollListRow[] }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ handed: [] }>();

const labs = useLabList();
const scanners = useScannerList();
const kinds = useScannerKinds();
const handOver = useHandOverRolls();
const form = useForm({ schema: HandOverSchema });
const today = () => new Date().toLocaleDateString('en-CA');

/**
 * The rolls picked when the dialog opened. Kept as they were: after a failed send the list
 * refreshes, and rolls a lost reply already handed over would leave the picked rows.
 */
const batch = ref<RollListRow[]>([]);
/** The last body sent and its key: resending the same batch reuses the key. */
let sent: { body: string; key: string } | undefined;
/** The job each roll goes for, by roll id; starts from the roll's plan. */
const types = ref<Record<string, ProcessingType>>({});
const scanOrders = ref<ScanOrder[]>([]);
const scanError = ref<string>();
/** Scanners picked by hand stay when the lab changes. */
const scannersTouched = ref(false);

watch(open, (isOpen) => {
  if (!isOpen) return;
  batch.value = props.rows;
  sent = undefined;
  types.value = Object.fromEntries(props.rows.map((row) => [row.roll.id, handOverType(row)]));
  scanOrders.value = [];
  scanError.value = undefined;
  scannersTouched.value = false;
  reset(form, { initialInput: { handedAt: today() } });
});

const labId = computed(() => getInput(form, { path: ['labId'] }));
const lab = computed(() => labs.data.value?.find((entry) => entry.id === labId.value));
const labOptions = computed(() =>
  (labs.data.value ?? []).map((entry) => ({ value: entry.id, label: entry.name })),
);
const needsScanners = computed(() =>
  batch.value.some((row) => producesScans(types.value[row.roll.id] ?? 'scan')),
);

/** A lab scans on its default scanner, or the Noritsu when it names none (as Send to Lab does). */
function labScanOrders(): ScanOrder[] {
  const scannerId = lab.value?.scannerIds.length ? lab.value.defaultScannerId : NORITSU_HS1800;
  const scanner = scanners.data.value?.find((candidate) => candidate.id === scannerId);
  return scannerId
    ? [{ scannerId, settings: scanner ? startingSettings(kinds.data.value, scanner) : {} }]
    : [];
}
watch([labId, () => scanners.data.value, () => kinds.data.value], () => {
  if (open.value && !scannersTouched.value) scanOrders.value = labScanOrders();
});
function pickScanners(orders: ScanOrder[]) {
  scanOrders.value = orders;
  scannersTouched.value = true;
}

const typeOptions = (row: RollListRow) =>
  handOverTypes(row).map((type) => ({ value: type, label: PROCESSING_TYPE_LABELS[type] }));

async function submit(output: v.InferOutput<typeof HandOverSchema>) {
  if (needsScanners.value && !scanOrders.value.length) {
    scanError.value = 'Pick at least one scanner.';
    return;
  }
  const input = {
    ...output,
    scanOrders: needsScanners.value ? scanOrders.value : [],
    rolls: batch.value.map((row) => ({
      rollId: row.roll.id,
      type: types.value[row.roll.id] ?? handOverType(row),
    })),
  };
  const body = JSON.stringify(input);
  if (sent?.body !== body) sent = { body, key: crypto.randomUUID() };
  const ok = await attempt(handOver.mutateAsync({ ...input, idempotencyKey: sent.key }));
  if (!ok) return;
  open.value = false;
  emit('handed');
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    title="Hand to Lab"
    :description="`${batch.length} roll${batch.length === 1 ? '' : 's'} go to one lab together. If one cannot go, none is handed over.`"
    submit-label="Hand to lab"
    :pending="handOver.isPending.value"
    @submit="submit"
  >
    <FormSection
      no="01"
      title="Lab"
      note="* Required attributes"
    >
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormSelect
          :of="form"
          :path="['labId']"
          label="Lab"
          required
          placeholder="Select a lab"
          :options="labOptions"
        />
        <FormInput
          :of="form"
          :path="['handedAt']"
          label="Date handed over"
          required
          type="date"
          :max="today()"
        />
        <FormInput
          :of="form"
          :path="['notes']"
          label="Notes"
          optional
        />
      </div>
    </FormSection>

    <FormSection
      no="02"
      title="Rolls"
      note="One job per roll"
    >
      <ul class="divide-y rounded-lg border">
        <li
          v-for="row in batch"
          :key="row.roll.id"
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <div>
            <div class="font-medium">{{ row.stockName }}</div>
            <div class="text-xs text-muted-foreground">
              {{ row.roll.format }} · {{ row.roll.exposures }} exp
            </div>
          </div>
          <Select
            v-model="types[row.roll.id]"
            class="w-44"
            :aria-label="`Service for ${row.stockName}`"
            :allow-empty="false"
            :disabled="handOverTypes(row).length === 1"
            :options="typeOptions(row)"
          />
        </li>
      </ul>
    </FormSection>

    <FormSection
      v-if="needsScanners"
      no="03"
      title="Scans"
      note="For every roll that is scanned"
    >
      <ScanOrderPicker
        :model-value="scanOrders"
        :error="scanError"
        :offered="lab?.scannerIds"
        @update:model-value="pickScanners"
      />
    </FormSection>
  </SectionedFormDialog>
</template>
