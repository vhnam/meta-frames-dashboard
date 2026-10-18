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
import FormInput from "#/shared/components/FormInput.vue";
import FormRichText from "#/shared/components/FormRichText.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { attempt } from "#/shared/lib/ui";
import { formatDate } from "#/shared/lib/format";

const props = defineProps<{
  row?: RollRow;
  /** Process of the roll's stock: the default for the job. */
  process?: Process;
  /** Date the roll was finished, when known. */
  finishedOn?: string | null;
  /** Edit this job instead of sending the roll: its lab stays fixed. */
  job?: RollJob;
  /** Services offered for a new job; defaults to all. */
  types?: ProcessingType[];
  /** Scan the roll again, at a lab or at home: worded as a re-scan rather than a send. */
  rescan?: boolean;
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
  scanOrders.value = producesScans(first) ? defaultScanOrders(SELF) : [];
  // the form starts at home, where the work is done by the time it is recorded
  const today = new Date().toLocaleDateString("en-CA");
  reset(form, {
    initialInput: {
      labId: SELF,
      type: first,
      process: props.process ?? "C-41",
      scansReceivedAt: today,
      negativesReturnedAt: today,
    },
  });
});

const type = computed(() => getInput(form, { path: ["type"] }));
const lockedScanners = computed(
  () =>
    props.job?.scanOrders.filter((order) => order.scanCount > 0).map((order) => order.scanner) ??
    [],
);
const needsScanners = computed(() => !!type.value && producesScans(type.value));
const labId = computed(() => getInput(form, { path: ["labId"] }));
const atHome = computed(() => labId.value === SELF);
/** A lab that develops the film returns the negatives; home and scan-only or print jobs do not. */
const expectsNegatives = computed(
  () => !!type.value && developsFilm(type.value) && !!labId.value && !atHome.value,
);
/** Negatives are recorded for a service that develops, at a lab or at home. */
const recordsNegatives = computed(() => !!type.value && developsFilm(type.value));
/** Receipt dates are asked for when editing a job, and for work done at home. */
const showReceipts = computed(() => !!props.job || atHome.value);
/** Stand-in value for working at home: the API takes no lab id then. */
const SELF = "self";
/** A lab scans on its Noritsu by default; at home it is some other scanner. */
const defaultScanOrders = (lab: string | undefined): ScanOrder[] => [
  { scanner: lab === SELF ? "other" : "noritsu", hiRes: false },
];
const isDefaultOrder = (orders: ScanOrder[]) =>
  orders.length === 1 &&
  !orders[0].hiRes &&
  (orders[0].scanner === "noritsu" || orders[0].scanner === "other");

watch(needsScanners, (needs) => {
  if (needs && !scanOrders.value.length) scanOrders.value = defaultScanOrders(labId.value);
});
// a new job follows the lab with its scanner until the scanners are picked by hand
watch(labId, (lab) => {
  if (!props.job && needsScanners.value && isDefaultOrder(scanOrders.value))
    scanOrders.value = defaultScanOrders(lab);
});

const SELF_LABELS: Record<ProcessingType, string> = {
  develop: "Self-develop",
  develop_scan: "Self-develop",
  scan: "Self-scan (at home)",
  print: "Self-print (at home)",
};
const labOptions = computed(() => [
  { value: SELF, label: type.value ? SELF_LABELS[type.value] : "Myself (at home)" },
  ...(labs.data.value ?? []).map((lab) => ({ value: lab.id, label: lab.name })),
]);
// built here: inline in the template, vue-tsc reported a `.value` access on the label maps
/**
 * Services a job can switch to. Developing happens once, so a developing job stays one and a scan
 * or print job cannot start developing; a job with imported scans keeps scanning.
 */
const editableTypes = computed((): ProcessingType[] => {
  const job = props.job;
  if (!job) return [];
  const types: ProcessingType[] = developsFilm(job.type)
    ? ["develop", "develop_scan"]
    : ["scan", "print"];
  return lockedScanners.value.length ? types.filter(producesScans) : types;
});
const typeOptions = computed(() =>
  (props.job ? editableTypes.value : offered.value).map((serviceType) => ({
    value: serviceType,
    label: PROCESSING_TYPE_LABELS[serviceType],
  })),
);
const processOptions = PROCESSES.map((process) => ({
  value: process,
  label: PROCESS_LABELS[process],
}));

const summary = computed(() =>
  [
    props.row?.roll.format,
    `${props.row?.roll.exposures} exp`,
    props.finishedOn ? `finished ${formatDate(props.finishedOn)}` : undefined,
  ]
    .filter(Boolean)
    .join(" · "),
);

/** Section numbers: the roll and scanner sections are not always shown. */
const no = computed(() => {
  let counter = 0;
  const next = (shown = true) => (shown ? String(++counter).padStart(2, "0") : "");
  return {
    roll: next(!!props.row),
    lab: next(),
    scans: next(needsScanners.value),
    dates: next(),
    notes: next(),
  };
});

async function submit(output: v.InferOutput<typeof SendToLabSchema>) {
  if (!props.row) return;
  if (needsScanners.value && !scanOrders.value.length) {
    scanError.value = "Pick at least one scanner.";
    return;
  }
  const { scansReceivedAt, negativesReturnedAt, ...fields } = output;
  const input = {
    ...fields,
    // scans are only expected from a scanning job; negatives from a lab that develops
    scansExpectedAt: needsScanners.value && !atHome.value ? fields.scansExpectedAt : undefined,
    negativesExpectedAt: expectsNegatives.value ? fields.negativesExpectedAt : undefined,
    labId: output.labId === SELF ? undefined : output.labId,
    scanOrders: needsScanners.value ? scanOrders.value : [],
  };
  const rollId = props.row.roll.id;
  const job = props.job;
  const ok = await attempt(
    (async () => {
      if (!job)
        return send.mutateAsync({
          rollId,
          input,
          received: atHome.value
            ? {
                scansAt: needsScanners.value ? scansReceivedAt : undefined,
                negativesAt: recordsNegatives.value ? negativesReturnedAt : undefined,
              }
            : undefined,
        });
      await update.mutateAsync({ rollId, jobId: job.id, input });
      // The API has its own endpoints for the two receipt dates; each is only sent when changed.
      if (scansReceivedAt && needsScanners.value && scansReceivedAt !== job.scansReceivedDate)
        await scansReceived.mutateAsync({ rollId, jobId: job.id, date: scansReceivedAt });
      if (
        negativesReturnedAt &&
        recordsNegatives.value &&
        negativesReturnedAt !== job.negativesReturnedDate
      )
        await negativesReturned.mutateAsync({ rollId, jobId: job.id, date: negativesReturnedAt });
    })(),
  );
  if (ok) open.value = false;
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    :title="job ? 'Edit Processing Job' : rescan ? 'Re-scan Roll' : 'Send to Lab'"
    :description="
      job
        ? 'Update the lab, price, scanners and dates of this job'
        : rescan
          ? 'Scan the negatives again, at another lab or yourself. Earlier jobs and scans stay'
          : atHome
            ? 'Record work done at home, with the days the negatives and scans were ready'
            : 'The roll becomes At Lab and shows under In Progress in the Lab tab'
    "
    :submit-label="
      job ? 'Save changes' : rescan ? 'Add re-scan' : atHome ? 'Record processing' : 'Send to lab'
    "
    :pending="send.isPending.value || update.isPending.value"
    @submit="submit"
  >
    <FormSection v-if="row" :no="no.roll" title="Roll">
      <div class="border-primary/15 bg-primary/5 rounded-lg border p-5">
        <div class="font-heading text-lg font-semibold">{{ row.stockName }}</div>
        <div class="text-muted-foreground text-sm">{{ summary }}</div>
      </div>
    </FormSection>

    <FormSection
      :no="no.lab"
      title="Lab & service"
      :note="job ? 'The lab is fixed' : '* Required attributes'"
    >
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormSelect
          :of="form"
          :path="['labId']"
          label="Lab"
          required
          :disabled="!!job"
          placeholder="Select a lab"
          :options="labOptions"
        />
        <FormSelect :of="form" :path="['type']" label="Service" required :options="typeOptions" />
        <FormSelect
          :of="form"
          :path="['process']"
          label="Process"
          required
          :options="processOptions"
        />
        <FormInput
          :of="form"
          :path="['price']"
          label="Price"
          optional
          type="number"
          min="0"
          step="1000"
          suffix="₫"
          placeholder="e.g. 280000"
        />
      </div>
    </FormSection>

    <FormSection v-if="needsScanners" :no="no.scans" title="Scans" note="One order per scanner">
      <ScanOrderPicker v-model="scanOrders" :error="scanError" :locked="lockedScanners" />
    </FormSection>

    <FormSection :no="no.dates" title="Dates" note="Leave blank when not known yet">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormInput
          :of="form"
          :path="['sentAt']"
          :label="atHome ? 'Date started' : 'Date sent'"
          optional
          type="date"
        />
        <FormInput
          v-if="needsScanners && !atHome"
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
        <template v-if="showReceipts">
          <FormInput
            v-if="recordsNegatives"
            :of="form"
            :path="['negativesReturnedAt']"
            :label="atHome ? 'Negatives developed' : 'Negatives returned'"
            optional
            type="date"
          />
          <FormInput
            v-if="needsScanners"
            :of="form"
            :path="['scansReceivedAt']"
            :label="atHome ? 'Scanned' : 'Scans received'"
            optional
            type="date"
          />
        </template>
      </div>
    </FormSection>

    <FormSection :no="no.notes" title="Notes">
      <FormRichText
        :of="form"
        :path="['notes']"
        label="Notes"
        optional
        placeholder="Push/pull, scan resolution, tracking number…"
      >
        <template #aside>
          <span class="text-muted-foreground text-xs">Markdown shortcuts work</span>
        </template>
      </FormRichText>
    </FormSection>
  </SectionedFormDialog>
</template>
