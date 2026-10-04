<script setup lang="ts">
import { useCameraDetail, useSaveCamera } from "../queries";
import { CameraSchema } from "../schema";
import { Field, getInput, reset, setInput, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, watch } from "vue";
import FormDialog from "#/shared/components/FormDialog.vue";
import FormInput from "#/shared/components/FormInput.vue";
import { Switch } from "#/shared/ui/switch";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{ cameraId?: string }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [id: string] }>();

const detail = useCameraDetail(() => props.cameraId);
const save = useSaveCamera();
const form = useForm({ schema: CameraSchema, initialInput: { fixedLens: false } });
const fixedLens = computed(() => !!getInput(form, { path: ["fixedLens"] }));

type Detail = NonNullable<typeof detail.data.value>;

function fill(d?: Detail) {
  const c = d?.camera;
  const lens = c?.fixedLens ? d?.lenses[0] : undefined;
  reset(form, {
    initialInput: {
      brand: c?.brand ?? "",
      model: c?.model ?? "",
      fixedLens: c?.fixedLens ?? false,
      mount: c?.mount ?? "",
      description: c?.description ?? "",
      focalLength: lens?.focalLength,
      maxAperture: lens?.maxAperture,
    },
  });
}

/** An edit opened before its detail query has answered is filled once the data arrives. */
let waitingForDetail = false;

watch(open, (isOpen) => {
  if (!isOpen) return;
  const d = detail.data.value ?? undefined;
  waitingForDetail = !!props.cameraId && !d;
  fill(props.cameraId ? d : undefined);
});

watch(
  () => detail.data.value,
  (d) => {
    if (!open.value || !waitingForDetail || !d) return;
    waitingForDetail = false;
    fill(d);
  },
);

async function submit(o: v.InferOutput<typeof CameraSchema>) {
  const input = {
    brand: o.brand,
    model: o.model,
    mount: o.mount,
    description: o.description,
    fixedLens: o.fixedLens,
  };
  const builtIn =
    o.fixedLens && !props.cameraId
      ? { focalLength: o.focalLength!, maxAperture: o.maxAperture! }
      : undefined;
  let id = props.cameraId ?? "";
  const ok = await attempt(
    save.mutateAsync({ id: props.cameraId, input, builtIn }).then((saved) => (id = saved)),
  );
  if (ok) {
    open.value = false;
    emit("saved", id);
  }
}
</script>

<template>
  <FormDialog
    v-model:open="open"
    :form="form"
    :title="cameraId ? 'Edit camera' : 'Add camera'"
    @submit="submit"
  >
    <div class="grid grid-cols-2 gap-3">
      <FormInput :of="form" :path="['brand']" label="Brand" placeholder="e.g. Nikon" />
      <FormInput :of="form" :path="['model']" label="Model" placeholder="e.g. FM2" />
    </div>
    <Field :of="form" :path="['fixedLens']" v-slot="field">
      <label class="flex items-center gap-2 text-sm">
        <Switch
          :model-value="!!field.input"
          :disabled="!!cameraId"
          @update:model-value="(v: boolean) => setInput(form, { path: ['fixedLens'], input: v })"
        />
        Fixed (built-in) lens
      </label>
    </Field>
    <FormInput
      v-if="!fixedLens"
      :of="form"
      :path="['mount']"
      label="Mount"
      hint="e.g. Canon FD, Nikon F, Leica M"
      placeholder="e.g. F"
    />
    <div v-else-if="!cameraId" class="grid grid-cols-2 gap-3">
      <FormInput
        :of="form"
        :path="['focalLength']"
        label="Focal length (mm)"
        type="number"
        min="1"
        placeholder="e.g. 50"
      />
      <FormInput
        :of="form"
        :path="['maxAperture']"
        label="Max aperture (f/)"
        type="number"
        step="0.1"
        min="0.5"
        placeholder="e.g. 1.8"
      />
    </div>
    <p v-else class="text-muted-foreground text-xs">Edit the built-in lens on the Lenses page.</p>
    <FormInput
      :of="form"
      :path="['description']"
      label="Description"
      optional
      multiline
      placeholder="Add a description"
    />
  </FormDialog>
</template>
