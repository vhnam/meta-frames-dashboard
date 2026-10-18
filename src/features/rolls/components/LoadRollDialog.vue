<script setup lang="ts">
import { cameraName, useCameraList } from "#/features/cameras";
import { useLoadRoll } from "../queries";
import { LoadRollSchema } from "../schema";
import type { RollRow } from "../types";
import { getInput, reset, setInput, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, watch } from "vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import QuickPicks from "#/shared/components/QuickPicks.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{ row?: RollRow }>();
const open = defineModel<boolean>("open", { required: true });

const cameras = useCameraList();
const load = useLoadRoll();
const form = useForm({ schema: LoadRollSchema });

watch(open, (isOpen) => {
  if (isOpen) reset(form, { initialInput: { cameraId: "" } });
});

const cameraOptions = computed(() =>
  (cameras.data.value ?? [])
    .filter((row) => !row.loaded)
    .map((row) => ({ value: row.camera.id, label: cameraName(row.camera) })),
);

/** Pull one stop, box speed, push one and two stops. The list endpoint has no box ISO. */
const isoPicks = computed(() => {
  const box = props.row?.boxIso;
  return box ? [box / 2, box, box * 2, box * 4] : [];
});

async function submit(output: v.InferOutput<typeof LoadRollSchema>) {
  if (!props.row) return;
  const ok = await attempt(load.mutateAsync({ id: props.row.roll.id, input: output }));
  if (ok) open.value = false;
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    title="Load Into Camera"
    description="Start shooting this roll: the camera, the day it went in and the speed"
    submit-label="Load roll"
    :pending="load.isPending.value"
    @submit="submit"
  >
    <FormSection v-if="row" no="01" title="Roll">
      <div class="border-primary/15 bg-primary/5 rounded-lg border p-5">
        <div class="font-heading text-lg font-semibold">{{ row.stockName }}</div>
        <div class="text-muted-foreground text-sm">
          {{ row.roll.format }} · {{ row.roll.exposures }} exp
          <template v-if="row.boxIso"> · ISO {{ row.boxIso }}</template>
        </div>
      </div>
    </FormSection>

    <FormSection :no="row ? '02' : '01'" title="Camera" note="* Required attributes">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormSelect
          :of="form"
          :path="['cameraId']"
          label="Camera"
          required
          placeholder="Select a camera"
          hint="A camera that already has a roll loaded is not listed."
          :options="cameraOptions"
        />
        <FormInput :of="form" :path="['startedAt']" label="Date loaded" optional type="date" />
      </div>
    </FormSection>

    <FormSection :no="row ? '03' : '02'" title="Exposure" note="Push or pull">
      <FormInput
        :of="form"
        :path="['shotIso']"
        label="Shot at ISO"
        optional
        type="number"
        min="1"
        step="1"
        suffix="ASA/ISO"
        :placeholder="row?.boxIso ? String(row.boxIso) : 'Box speed'"
        :hint="
          row?.boxIso
            ? `Box speed is ISO ${row.boxIso}. Leave blank to shoot at box speed, or enter a different value to push or pull.`
            : 'Leave blank to shoot at box speed, or enter a different value to push or pull.'
        "
      >
        <template v-if="isoPicks.length" #aside>
          <QuickPicks
            :values="isoPicks"
            :current="getInput(form, { path: ['shotIso'] })"
            label="Pull one stop, box speed, push one or two stops"
            @pick="(value) => setInput(form, { path: ['shotIso'], input: value })"
          />
        </template>
      </FormInput>
    </FormSection>
  </SectionedFormDialog>
</template>
