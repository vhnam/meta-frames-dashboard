<script setup lang="ts">
import { useLabList } from "#/features/labs";
import { PROCESSES } from "#/features/film-stocks/types";
import { PROCESS_LABELS } from "#/features/film-stocks/types";
import type { Process } from "#/features/film-stocks/types";
import { useSendToLab } from "../queries";
import { SendToLabSchema } from "../schema";
import { PROCESSING_TYPES, PROCESSING_TYPE_LABELS } from "../types";
import type { RollRow } from "../types";
import { reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, watch } from "vue";
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
}>();
const open = defineModel<boolean>("open", { required: true });

const labs = useLabList();
const send = useSendToLab();
const form = useForm({ schema: SendToLabSchema });

watch(open, (isOpen) => {
  if (isOpen)
    reset(form, {
      initialInput: { labId: SELF, type: "develop_scan", process: props.process ?? "C-41" },
    });
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
  const ok = await attempt(
    send.mutateAsync({
      rollId: props.row.roll.id,
      input: { ...o, labId: o.labId === SELF ? undefined : o.labId },
    }),
  );
  if (ok) open.value = false;
}
</script>

<template>
  <FormDialog
    v-model:open="open"
    :form="form"
    title="Send to lab"
    submit-label="Send to lab"
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
      :options="PROCESSING_TYPES.map((t) => ({ value: t, label: PROCESSING_TYPE_LABELS[t] }))"
    />
    <div class="grid grid-cols-2 gap-3">
      <FormSelect
        :of="form"
        :path="['process']"
        label="Process"
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
    <FormInput :of="form" :path="['sentAt']" label="Date sent" optional type="date" />
    <FormInput
      :of="form"
      :path="['notes']"
      label="Notes"
      optional
      multiline
      placeholder="Push/pull, scan resolution, tracking number…"
    />
    <p class="text-muted-foreground text-xs">
      The roll becomes At Lab and appears under In Progress in the Lab tab.
    </p>
  </FormDialog>
</template>
