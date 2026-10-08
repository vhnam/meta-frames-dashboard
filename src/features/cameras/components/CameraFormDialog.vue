<script setup lang="ts">
import { useCameraDetail, useSaveCamera } from "../queries";
import { useKnownBrands, useKnownMounts } from "../known";
import { CameraSchema } from "../schema";
import { Field, getInput, reset, setInput, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, watch } from "vue";
import FormCombobox from "#/shared/components/FormCombobox.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormRichText from "#/shared/components/FormRichText.vue";
import QuickPicks from "#/shared/components/QuickPicks.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { Switch } from "#/shared/ui/switch";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{ cameraId?: string }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [id: string] }>();

const detail = useCameraDetail(() => props.cameraId);
const save = useSaveCamera();
const form = useForm({ schema: CameraSchema, initialInput: { fixedLens: false } });
const fixedLens = computed(() => !!getInput(form, { path: ["fixedLens"] }));
const editing = computed(() => !!props.cameraId);
const mounts = useKnownMounts();
const brands = useKnownBrands();

const FOCAL_PICKS = [24, 35, 50];
const APERTURE_PICKS = [1.4, 2, 2.8];

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
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    :title="editing ? 'Edit Camera' : 'Add Camera'"
    :description="
      editing ? 'Update the body, its mount and notes' : 'Register a camera body you shoot with'
    "
    :submit-label="editing ? 'Save changes' : 'Add camera'"
    :pending="save.isPending.value"
    @submit="submit"
  >
    <FormSection no="01" title="Camera body" note="* Required attributes">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormCombobox
          :of="form"
          :path="['brand']"
          label="Brand"
          required
          noun="brand"
          :options="brands"
          placeholder="Choose or type a brand"
        >
          <template #aside>
            <span class="text-muted-foreground text-xs">e.g. Nikon, Leica</span>
          </template>
        </FormCombobox>
        <FormInput :of="form" :path="['model']" label="Model" required placeholder="e.g. FM2">
          <template #aside>
            <span class="text-muted-foreground text-xs">e.g. FM2, M6</span>
          </template>
        </FormInput>
      </div>
    </FormSection>

    <FormSection no="02" title="Lens & mount">
      <Field :of="form" :path="['fixedLens']" v-slot="field">
        <label
          class="border-primary/15 bg-primary/5 flex items-center justify-between gap-4 rounded-lg border p-4"
        >
          <span class="grid gap-1">
            <span class="font-heading text-sm font-medium">Fixed (built-in) lens</span>
            <span class="text-muted-foreground text-xs">
              {{
                editing
                  ? "Can't be changed after the camera is added."
                  : "For compacts and rangefinders whose lens can't come off."
              }}
            </span>
          </span>
          <Switch
            :model-value="!!field.input"
            :disabled="editing"
            @update:model-value="(v: boolean) => setInput(form, { path: ['fixedLens'], input: v })"
          />
        </label>
      </Field>
      <FormCombobox
        v-if="!fixedLens"
        :of="form"
        :path="['mount']"
        label="Mount"
        required
        noun="mount"
        :options="mounts"
        hint="Pick a mount you already use, or type a new one. Lenses for it can be added later."
        placeholder="Choose or type a mount"
      >
        <template #aside>
          <span class="text-muted-foreground text-xs">e.g. Canon FD, Nikon F, Leica M</span>
        </template>
      </FormCombobox>
      <div v-else-if="!editing" class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormInput
          :of="form"
          :path="['focalLength']"
          label="Focal length"
          required
          type="number"
          min="1"
          suffix="mm"
          placeholder="e.g. 35"
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
          step="0.1"
          min="0.5"
          placeholder="e.g. 2.8"
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
      <p v-else class="text-muted-foreground text-sm">Edit the built-in lens on the Lenses page.</p>
    </FormSection>

    <FormSection no="03" title="Notes">
      <FormRichText
        :of="form"
        :path="['description']"
        label="Description"
        optional
        placeholder="Condition, quirks, light seals, meter accuracy…"
      >
        <template #aside>
          <span class="text-muted-foreground text-xs">Markdown shortcuts work</span>
        </template>
      </FormRichText>
    </FormSection>
  </SectionedFormDialog>
</template>
