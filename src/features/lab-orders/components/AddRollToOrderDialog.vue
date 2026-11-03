<script setup lang="ts">
import { useAddJobToLine, useLinkableJobs } from "../queries";
import { roomOnLine } from "../types";
import type { LabOrder } from "../types";
import { PROCESSING_TYPE_LABELS } from "#/features/rolls/types";
import { computed, ref, watch } from "vue";
import EmptyState from "#/shared/components/EmptyState.vue";
import PlainDialog from "#/shared/components/PlainDialog.vue";
import Select from "#/shared/components/Select.vue";
import { Label } from "#/shared/ui/label";
import { formatDate } from "#/shared/lib/format";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{ order: LabOrder; lineId?: string }>();
const open = defineModel<boolean>("open", { required: true });

const jobs = useLinkableJobs(
  () => props.order.id,
  () => open.value,
);
const add = useAddJobToLine();
const jobId = ref("");
const lineId = ref("");
const error = ref<string>();

const lineOptions = computed(() =>
  props.order.lines
    .filter((line) => roomOnLine(line) > 0)
    .map((line) => ({
      value: line.id,
      label: `${line.product} (${line.jobs.length} of ${line.quantity})`,
    })),
);
const jobOptions = computed(() =>
  (jobs.data.value ?? []).map((job) => ({
    value: job.id,
    label: `${job.stockName} · ${job.format} · ${PROCESSING_TYPE_LABELS[job.type]} · sent ${formatDate(job.sentDate)}`,
  })),
);

watch(open, (isOpen) => {
  if (!isOpen) return;
  error.value = undefined;
  jobId.value = "";
  lineId.value = props.lineId ?? lineOptions.value[0]?.value ?? "";
});

async function submit() {
  if (!jobOptions.value.length) {
    open.value = false;
    return;
  }
  if (!jobId.value || !lineId.value) {
    error.value = "Pick a roll and a line.";
    return;
  }
  if (await attempt(add.mutateAsync({ jobId: jobId.value, lineId: lineId.value })))
    open.value = false;
}
</script>

<template>
  <PlainDialog
    v-model:open="open"
    title="Add Roll to Order"
    :description="`Rolls sent to ${order.labName} that are on no order yet`"
    :submit-label="jobOptions.length ? 'Add roll' : 'Close'"
    @submit="submit"
  >
    <EmptyState
      v-if="!jobs.isPending.value && !jobOptions.length"
      :text="`No roll is waiting for an order. Send a roll to ${order.labName} first.`"
    />
    <template v-else>
      <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
        <Label>Roll</Label>
        <Select
          v-model="jobId"
          :options="jobOptions"
          placeholder="Select a roll"
          :allow-empty="false"
        />
      </div>
      <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
        <Label>Order line</Label>
        <Select
          v-model="lineId"
          :options="lineOptions"
          placeholder="Select a line"
          :allow-empty="false"
        />
      </div>
      <p v-if="error" class="text-destructive text-sm">{{ error }}</p>
    </template>
  </PlainDialog>
</template>
