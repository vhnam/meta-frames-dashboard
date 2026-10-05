<script setup lang="ts">
import { cameraName, useCameraList } from "#/features/cameras";
import { useLoadRoll } from "../queries";
import { LoadRollSchema } from "../schema";
import type { RollRow } from "../types";
import { reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, watch } from "vue";
import FormDialog from "#/shared/components/FormDialog.vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
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
    .filter((r) => !r.loaded)
    .map((r) => ({ value: r.camera.id, label: cameraName(r.camera) })),
);

async function submit(o: v.InferOutput<typeof LoadRollSchema>) {
  if (!props.row) return;
  const ok = await attempt(load.mutateAsync({ id: props.row.roll.id, input: o }));
  if (ok) open.value = false;
}
</script>

<template>
  <FormDialog
    v-model:open="open"
    :form="form"
    title="Load into camera"
    submit-label="Load roll"
    @submit="submit"
  >
    <div v-if="row" class="bg-muted/50 rounded-xl px-4 py-3">
      <div class="font-medium">{{ row.stockName }}</div>
      <div class="text-muted-foreground text-sm">
        {{ row.roll.format }} · {{ row.roll.exposures }} exp
      </div>
    </div>
    <FormSelect
      :of="form"
      :path="['cameraId']"
      label="Camera"
      placeholder="Select a camera"
      hint="A camera that already has a roll loaded is not listed."
      :options="cameraOptions"
    />
    <FormInput :of="form" :path="['startedAt']" label="Date loaded" optional type="date" />
    <FormInput
      :of="form"
      :path="['shotIso']"
      label="Shot at ISO (blank = box speed)"
      optional
      type="number"
      min="1"
      :placeholder="row?.boxIso ? String(row.boxIso) : undefined"
      :hint="`Box speed is ISO ${row?.boxIso}. Enter a different value to push or pull.`"
    />
  </FormDialog>
</template>
