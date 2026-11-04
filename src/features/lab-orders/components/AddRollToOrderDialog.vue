<script setup lang="ts">
import { useLinkableJobs, useSetJobLines } from "../queries";
import { AddRollToOrderSchema } from "../schema";
import { roomOnLine } from "../types";
import type { LabOrder } from "../types";
import { PROCESSING_TYPE_LABELS } from "#/features/rolls/types";
import { getInput, reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, ref, watch } from "vue";
import EmptyState from "#/shared/components/EmptyState.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { formatDate } from "#/shared/lib/format";
import { attempt } from "#/shared/lib/ui";
import OrderLinesPicker from "./OrderLinesPicker.vue";

const props = defineProps<{ order: LabOrder; lineId?: string }>();
const open = defineModel<boolean>("open", { required: true });

const jobs = useLinkableJobs(
  () => props.order.id,
  () => open.value,
);
const save = useSetJobLines();
const form = useForm({ schema: AddRollToOrderSchema });
const lineIds = ref<string[]>([]);
const linesError = ref<string>();

const jobOptions = computed(() =>
  (jobs.data.value ?? []).map((job) => ({
    value: job.id,
    label: `${job.stockName} · ${job.format} · ${PROCESSING_TYPE_LABELS[job.type]} · sent ${formatDate(job.sentDate)}`,
  })),
);
const noRolls = computed(() => !jobs.isPending.value && !jobOptions.value.length);
const jobId = computed(() => getInput(form, { path: ["jobId"] }));
/** Lines the chosen roll is already on: they stay ticked, and count as having room for it. */
const ownLineIds = computed(
  () => jobs.data.value?.find((job) => job.id === jobId.value)?.lineIds ?? [],
);
/** The line it was opened from, or the only line with room. */
const startingLines = () => {
  if (props.lineId) return [props.lineId];
  const open = props.order.lines.filter((line) => roomOnLine(line) > 0);
  return open.length === 1 ? [open[0].id] : [];
};

watch(open, (isOpen) => {
  if (!isOpen) return;
  linesError.value = undefined;
  lineIds.value = startingLines();
  reset(form, { initialInput: { jobId: "" } });
});
// choosing a roll keeps what it is on, plus the line this was opened from
watch(jobId, () => {
  if (open.value) lineIds.value = [...new Set([...ownLineIds.value, ...startingLines()])];
});

async function submit(output: v.InferOutput<typeof AddRollToOrderSchema>) {
  if (!lineIds.value.length) {
    linesError.value = "Tick at least one line.";
    return;
  }
  linesError.value = undefined;
  if (await attempt(save.mutateAsync({ jobId: output.jobId, lineIds: lineIds.value })))
    open.value = false;
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    title="Add Roll to Order"
    :description="`Rolls sent to ${order.labName}. One roll can go on several lines, such as developing and scanning`"
    submit-label="Add roll"
    :pending="save.isPending.value"
    :read-only="noRolls"
    @submit="submit"
  >
    <FormSection no="01" title="Order">
      <div class="border-primary/15 bg-primary/5 rounded-lg border p-5">
        <div class="font-heading text-lg font-semibold tabular-nums">#{{ order.code }}</div>
        <div class="text-muted-foreground text-sm">{{ order.labName }}</div>
      </div>
    </FormSection>

    <FormSection no="02" title="Roll & lines" :note="noRolls ? undefined : '* Required attributes'">
      <EmptyState
        v-if="noRolls"
        :text="`No roll is waiting for an order. Send a roll to ${order.labName} first.`"
      />
      <div v-else class="grid grid-cols-[minmax(0,1fr)] gap-y-6">
        <FormSelect
          :of="form"
          :path="['jobId']"
          label="Roll"
          required
          placeholder="Select a roll"
          :options="jobOptions"
        />
        <OrderLinesPicker
          v-model="lineIds"
          :lines="order.lines"
          :own-line-ids="ownLineIds"
          :error="linesError"
        />
      </div>
    </FormSection>
  </SectionedFormDialog>
</template>
