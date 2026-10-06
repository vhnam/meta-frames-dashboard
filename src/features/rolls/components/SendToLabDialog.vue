<script setup lang="ts">
import { useLabList } from "#/features/labs";
import { PROCESSES } from "#/features/film-stocks/types";
import { PROCESS_LABELS } from "#/features/film-stocks/types";
import type { Process } from "#/features/film-stocks/types";
import {
  useRecordNegativesReturned,
  useRecordScansReceived,
  useSendToLab,
  useUpdateJob,
} from "../queries";
import { SendToLabSchema } from "../schema";
import { PROCESSING_TYPES, PROCESSING_TYPE_LABELS, developsFilm, producesScans } from "../types";
import type { ProcessingType, RollJob, RollRow, ScanOrder } from "../types";
import { getInput, reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, ref, watch } from "vue";
import ScanOrderPicker from "./ScanOrderPicker.vue";
import FormDialog from "#/shared/components/FormDialog.vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{
  row?: RollRow;
  /** Process of the roll's stock: the default for the job. */
  process?: Process;
  /** Date the roll was finished, when known. */
  finishedOn?: string | null;
  /** Edit this job instead of sending the roll: its type and process stay fixed. */
  job?: RollJob;
  /** Services offered for a new job; defaults to all. */
  types?: ProcessingType[];
}>();
const open = defineModel<boolean>("open", { required: true });

const labs = useLabList();
const send = useSendToLab();
const update = useUpdateJob();
const scansReceived = useRecordScansReceived();
const negativesReturned = useRecordNegativesReturned();
const form = useForm({ schema: SendToLabSchema });

const scanOrders = ref<ScanOrder[]>([]);
const scanError = ref<string>();

const offered = computed(() => props.types ?? [...PROCESSING_TYPES]);

watch(open, (isOpen) => {
  if (!isOpen) return;
  scanError.value = undefined;
  const job = props.job;
  if (job) {
    scanOrders.value = job.scanOrders.map(({ scanner, hiRes }) => ({ scanner, hiRes }));
    reset(form, {
      initialInput: {
        labId: job.labId ?? SELF,
        type: job.type,
        process: job.process,
        price: job.price ?? undefined,
        sentAt: job.sentDate,
        scansExpectedAt: job.scansExpectedDate ?? undefined,
        negativesExpectedAt: job.negativesExpectedDate ?? undefined,
        notes: job.notes || undefined,
        scansReceivedAt: job.scansReceivedDate ?? undefined,
        negativesReturnedAt: job.negativesReturnedDate ?? undefined,
      },
    });
    return;
  }
  const first = offered.value[0] ?? "develop_scan";
  scanOrders.value = producesScans(first) ? [{ scanner: "noritsu", hiRes: false }] : [];
  reset(form, {
    initialInput: { labId: SELF, type: first, process: props.process ?? "C-41" },
  });
});

const type = computed(() => getInput(form, { path: ["type"] }));
const lockedScanners = computed(
  () => props.job?.scanOrders.filter((o) => o.scanCount > 0).map((o) => o.scanner) ?? [],
);
const needsScanners = computed(() => !!type.value && producesScans(type.value));
const labId = computed(() => getInput(form, { path: ["labId"] }));
/** A lab that develops the film returns the negatives; home and scan-only or print jobs do not. */
const expectsNegatives = computed(
  () => !!type.value && developsFilm(type.value) && !!labId.value && labId.value !== SELF,
);
watch(needsScanners, (needs) => {
  if (needs && !scanOrders.value.length) scanOrders.value = [{ scanner: "noritsu", hiRes: false }];
});

/** Stand-in value for developing at home: the API takes no lab id then. */
const SELF = "self";
const labOptions = computed(() => [
  { value: SELF, label: "Self-develop" },
  ...(labs.data.value ?? []).map((l) => ({ value: l.id, label: l.name })),
]);

const summary = computed(() =>
  [
    props.row?.roll.format,
    `${props.row?.roll.exposures} exp`,
    props.finishedOn ? `finished ${props.finishedOn}` : undefined,
  ]
    .filter(Boolean)
    .join(" · "),
);

async function submit(o: v.InferOutput<typeof SendToLabSchema>) {
  if (!props.row) return;
  if (needsScanners.value && !scanOrders.value.length) {
    scanError.value = "Pick at least one scanner.";
    return;
  }
  const { scansReceivedAt, negativesReturnedAt, ...fields } = o;
  const input = {
    ...fields,
    // scans are only expected from a scanning job; negatives from a lab that develops
    scansExpectedAt: needsScanners.value ? fields.scansExpectedAt : undefined,
    negativesExpectedAt: expectsNegatives.value ? fields.negativesExpectedAt : undefined,
    labId: o.labId === SELF ? undefined : o.labId,
    scanOrders: needsScanners.value ? scanOrders.value : [],
  };
  const rollId = props.row.roll.id;
  const job = props.job;
  const ok = await attempt(
    (async () => {
      if (!job) return send.mutateAsync({ rollId, input });
      await update.mutateAsync({ rollId, jobId: job.id, input });
      // The API has its own endpoints for the two receipt dates; each is only sent when changed.
      if (scansReceivedAt && needsScanners.value && scansReceivedAt !== job.scansReceivedDate)
        await scansReceived.mutateAsync({ rollId, jobId: job.id, date: scansReceivedAt });
      if (negativesReturnedAt && job.labId && negativesReturnedAt !== job.negativesReturnedDate)
        await negativesReturned.mutateAsync({ rollId, jobId: job.id, date: negativesReturnedAt });
    })(),
  );
  if (ok) open.value = false;
}
</script>

<template>
  <FormDialog
    v-model:open="open"
    :form="form"
    :title="job ? 'Edit processing job' : 'Send to lab'"
    :submit-label="job ? 'Save' : 'Send to lab'"
    @submit="submit"
  >
    <div v-if="row" class="bg-muted/50 rounded-xl px-4 py-3">
      <div class="font-medium">{{ row.stockName }}</div>
      <div class="text-muted-foreground text-sm">{{ summary }}</div>
    </div>
    <FormSelect
      :of="form"
      :path="['labId']"
      label="Lab"
      placeholder="Select a lab"
      :options="labOptions"
    />
    <FormSelect
      :of="form"
      :path="['type']"
      label="Service"
      :disabled="!!job"
      :options="
        (job ? [job.type] : offered).map((t) => ({ value: t, label: PROCESSING_TYPE_LABELS[t] }))
      "
    />
    <div class="grid grid-cols-2 gap-3">
      <FormSelect
        :of="form"
        :path="['process']"
        label="Process"
        :disabled="!!job"
        :options="PROCESSES.map((p) => ({ value: p, label: PROCESS_LABELS[p] }))"
      />
      <FormInput
        :of="form"
        :path="['price']"
        label="Price (₫)"
        optional
        type="number"
        min="0"
        placeholder="e.g. 280000"
      />
    </div>
    <ScanOrderPicker
      v-if="needsScanners"
      v-model="scanOrders"
      :error="scanError"
      :locked="lockedScanners"
    />
    <FormInput :of="form" :path="['sentAt']" label="Date sent" optional type="date" />
    <FormInput
      v-if="needsScanners"
      :of="form"
      :path="['scansExpectedAt']"
      label="Scans expected back"
      optional
      type="date"
    />
    <FormInput
      v-if="expectsNegatives"
      :of="form"
      :path="['negativesExpectedAt']"
      label="Negatives expected back"
      optional
      type="date"
    />
    <div v-if="job" class="grid gap-3">
      <FormInput
        v-if="needsScanners"
        :of="form"
        :path="['scansReceivedAt']"
        label="Scans received"
        optional
        type="date"
      />
      <FormInput
        v-if="job.labId"
        :of="form"
        :path="['negativesReturnedAt']"
        label="Negatives returned"
        optional
        type="date"
      />
    </div>
    <FormInput
      :of="form"
      :path="['notes']"
      label="Notes"
      optional
      multiline
      placeholder="Push/pull, scan resolution, tracking number…"
    />
    <p v-if="!job" class="text-muted-foreground text-xs">
      The roll becomes At Lab and appears under In Progress in the Lab tab.
    </p>
  </FormDialog>
</template>
