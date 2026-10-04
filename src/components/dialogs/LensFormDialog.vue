<script setup lang="ts">
import { reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { watch } from "vue";
import FormDialog from "#/components/common/FormDialog.vue";
import FormInput from "#/components/common/FormInput.vue";
import { useLensList, useSaveLens } from "#/api";
import { LensSchema } from "#/domain/schemas";
import { attempt } from "#/lib/ui";

const props = defineProps<{ lensId?: string }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [id: string] }>();

const lenses = useLensList();
const save = useSaveLens();
const current = () => lenses.data.value?.find((r) => r.lens.id === props.lensId)?.lens;
const form = useForm({ schema: LensSchema, initialInput: { builtIn: false } });
const builtIn = () => !!current()?.builtInCameraId;
const mounts = () => [
  ...new Set((lenses.data.value ?? []).map((r) => r.lens.mount).filter(Boolean)),
];

watch(open, (isOpen) => {
  if (!isOpen) return;
  const l = current();
  reset(form, {
    initialInput: {
      builtIn: !!l?.builtInCameraId,
      brand: l?.brand ?? "",
      model: l?.model ?? "",
      mount: l?.mount ?? "",
      focalLength: l?.focalLength,
      maxAperture: l?.maxAperture,
      description: l?.description ?? "",
    },
  });
});

async function submit(o: v.InferOutput<typeof LensSchema>) {
  const input = {
    brand: o.brand,
    model: o.model,
    mount: o.mount,
    focalLength: o.focalLength,
    maxAperture: o.maxAperture,
    description: o.description,
  };
  let id = props.lensId ?? "";
  const ok = await attempt(
    save.mutateAsync({ id: props.lensId, input }).then((saved) => (id = saved)),
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
    :title="lensId ? 'Edit lens' : 'Add lens'"
    description="Prime lenses only."
    @submit="submit"
  >
    <div class="grid grid-cols-2 gap-3">
      <FormInput
        :of="form"
        :path="['brand']"
        label="Brand"
        :optional="builtIn()"
        placeholder="e.g. Nikon"
      />
      <FormInput
        :of="form"
        :path="['model']"
        label="Model"
        :optional="builtIn()"
        placeholder="e.g. FM2"
      />
    </div>
    <template v-if="!builtIn()">
      <FormInput
        :of="form"
        :path="['mount']"
        label="Mount"
        list="lens-mounts"
        placeholder="e.g. F"
      />
      <datalist id="lens-mounts">
        <option v-for="m in mounts()" :key="m" :value="m" />
      </datalist>
    </template>
    <div class="grid grid-cols-2 gap-3">
      <FormInput
        :of="form"
        :path="['focalLength']"
        label="Focal length (mm)"
        type="number"
        min="1"
        step="1"
        placeholder="e.g. 50"
      />
      <FormInput
        :of="form"
        :path="['maxAperture']"
        label="Max aperture (f/)"
        type="number"
        min="0.5"
        step="0.1"
        placeholder="e.g. 1.8"
      />
    </div>
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
