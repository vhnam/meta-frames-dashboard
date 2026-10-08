<script setup lang="ts">
import { useDeleteLens, useLensList, useSaveLens } from "../queries";
import { useKnownBrands, useKnownMounts } from "#/features/cameras/known";
import { LensSchema } from "../schema";
import { getInput, reset, setInput, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, watch } from "vue";
import FormCombobox from "#/shared/components/FormCombobox.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormRichText from "#/shared/components/FormRichText.vue";
import QuickPicks from "#/shared/components/QuickPicks.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { Button } from "#/shared/ui/button";
import { ask, attempt } from "#/shared/lib/ui";

const props = defineProps<{ lensId?: string }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [id: string] }>();

const lenses = useLensList();
const save = useSaveLens();
const remove = useDeleteLens();
const current = () => lenses.data.value?.find((r) => r.lens.id === props.lensId)?.lens;
const form = useForm({ schema: LensSchema, initialInput: { builtIn: false } });
const builtIn = () => !!current()?.builtInCameraId;
const editing = computed(() => !!props.lensId);

const FOCAL_PICKS = [24, 35, 50];
const APERTURE_PICKS = [1.4, 2, 2.8];
const mounts = useKnownMounts();
const brands = useKnownBrands();

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

async function doDelete() {
  if (!props.lensId || !(await ask("Delete this lens?"))) return;
  if (await attempt(remove.mutateAsync(props.lensId))) open.value = false;
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    :title="editing ? 'Edit Lens' : 'Add Lens'"
    :description="
      builtIn()
        ? 'Built into its camera: only the optics and notes can change'
        : 'Register a prime lens: its maker, mount and optics'
    "
    :submit-label="editing ? 'Save changes' : 'Add lens'"
    :pending="save.isPending.value"
    @submit="submit"
  >
    <FormSection no="01" title="Lens" :note="builtIn() ? 'Built-in lens' : '* Required attributes'">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormCombobox
          :of="form"
          :path="['brand']"
          label="Brand"
          :required="!builtIn()"
          :optional="builtIn()"
          noun="brand"
          :options="brands"
          placeholder="Choose or type a brand"
        >
          <template #aside>
            <span class="text-muted-foreground text-xs">e.g. Nikon, Voigtländer</span>
          </template>
        </FormCombobox>
        <FormInput
          :of="form"
          :path="['model']"
          label="Model"
          :required="!builtIn()"
          :optional="builtIn()"
          placeholder="e.g. Nikkor-S"
        >
          <template #aside>
            <span class="text-muted-foreground text-xs">e.g. Nikkor-S, Summicron</span>
          </template>
        </FormInput>
        <div v-if="!builtIn()" class="sm:col-span-2">
          <FormCombobox
            :of="form"
            :path="['mount']"
            label="Mount"
            required
            noun="mount"
            :options="mounts"
            hint="Pick a mount you already use, or type a new one."
            placeholder="Choose or type a mount"
          >
            <template #aside>
              <span class="text-muted-foreground text-xs">e.g. Canon FD, Nikon F, Leica M</span>
            </template>
          </FormCombobox>
        </div>
      </div>
    </FormSection>

    <FormSection no="02" title="Optics" note="Prime lenses only">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormInput
          :of="form"
          :path="['focalLength']"
          label="Focal length"
          required
          type="number"
          min="1"
          step="1"
          suffix="mm"
          placeholder="e.g. 50"
        >
          <template #aside>
            <QuickPicks
              :values="FOCAL_PICKS"
              :current="getInput(form, { path: ['focalLength'] })"
              label="Common focal lengths"
              @pick="(n) => setInput(form, { path: ['focalLength'], input: n })"
            />
          </template>
        </FormInput>
        <FormInput
          :of="form"
          :path="['maxAperture']"
          label="Max aperture"
          required
          type="number"
          min="0.5"
          step="0.1"
          placeholder="e.g. 1.8"
        >
          <template #aside>
            <QuickPicks
              :values="APERTURE_PICKS"
              :current="getInput(form, { path: ['maxAperture'] })"
              label="Common apertures"
              :format="(n) => `f/${n}`"
              @pick="(n) => setInput(form, { path: ['maxAperture'], input: n })"
            />
          </template>
        </FormInput>
      </div>
    </FormSection>

    <FormSection no="03" title="Notes">
      <FormRichText
        :of="form"
        :path="['description']"
        label="Description"
        optional
        placeholder="Rendering, flare, focus throw, condition…"
      >
        <template #aside>
          <span class="text-muted-foreground text-xs">Markdown shortcuts work</span>
        </template>
      </FormRichText>
    </FormSection>

    <!-- a built-in lens goes with its camera, so it has no Delete -->
    <template v-if="editing && !builtIn()" #footer-start>
      <Button
        type="button"
        variant="ghost"
        class="text-destructive hover:text-destructive"
        :disabled="remove.isPending.value"
        @click="doDelete"
      >
        Delete
      </Button>
    </template>
  </SectionedFormDialog>
</template>
