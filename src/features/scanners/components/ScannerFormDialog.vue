<script setup lang="ts">
import { useDeleteScanner, useSaveScanner, useScannerKinds, useScannerList } from "../queries";
import { completeSettings, optionsForKind } from "../format";
import { ScannerSchema } from "../schema";
import { SCANNER_KINDS, SCANNER_KIND_LABELS } from "../types";
import type { ScanSettings } from "../types";
import ScanSettingsFields from "./ScanSettingsFields.vue";
import { getInput, reset, useForm } from "@formisch/vue";
import type * as v from "valibot";
import { computed, ref, watch } from "vue";
import FormInput from "#/shared/components/FormInput.vue";
import FormRichText from "#/shared/components/FormRichText.vue";
import FormSection from "#/shared/components/FormSection.vue";
import FormSelect from "#/shared/components/FormSelect.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { Button } from "#/shared/ui/button";
import { ask, attempt } from "#/shared/lib/ui";

const props = defineProps<{ scannerId?: string }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ saved: [id: string] }>();

const scanners = useScannerList();
const kinds = useScannerKinds();
const save = useSaveScanner();
const remove = useDeleteScanner();
const form = useForm({ schema: ScannerSchema });
const editing = computed(() => !!props.scannerId);
/** Built-in scanners are shared by every account: shown, never changed. */
const builtIn = computed(
  () => !!scanners.data.value?.find((entry) => entry.id === props.scannerId)?.builtIn,
);
const title = computed(() =>
  builtIn.value ? "Built-in Scanner" : editing.value ? "Edit Scanner" : "Add Scanner",
);
const description = computed(() =>
  builtIn.value
    ? "A lab scanner shared by every account. It cannot be changed; its orders start from these settings"
    : editing.value
      ? "Update this scanner. Its scans and orders follow the new name"
      : "A scanner of your own: a lab's Noritsu or Frontier, a flatbed, or a camera rig",
);
watch(open, (isOpen) => {
  if (!isOpen) return;
  const scanner = scanners.data.value?.find((entry) => entry.id === props.scannerId);
  reset(form, {
    initialInput: {
      brand: scanner?.brand ?? "",
      model: scanner?.model ?? "",
      kind: scanner?.kind ?? "",
      notes: scanner?.notes ?? "",
    },
  });
  defaultSettings.value = scanner?.defaultSettings ?? {};
});

/** Options of the kind picked in the form; the default settings follow it. */
const kind = computed(() => getInput(form, { path: ["kind"] }) || null);
const options = computed(() => optionsForKind(kinds.data.value, kind.value));
const defaultSettings = ref<ScanSettings>({});
watch(
  options,
  (current) => (defaultSettings.value = completeSettings(current, defaultSettings.value)),
  { immediate: true },
);

const kindOptions = SCANNER_KINDS.map((kind) => ({
  value: kind,
  label: SCANNER_KIND_LABELS[kind],
}));

async function submit(output: v.InferOutput<typeof ScannerSchema>) {
  let id = props.scannerId ?? "";
  const ok = await attempt(
    save
      .mutateAsync({
        id: props.scannerId,
        ...output,
        kind: output.kind || undefined,
        defaultSettings: completeSettings(options.value, defaultSettings.value),
      })
      .then((saved) => (id = saved)),
  );
  if (ok) {
    open.value = false;
    emit("saved", id);
  }
}

async function doDelete() {
  if (!props.scannerId || !(await ask("Delete this scanner?"))) return;
  if (await attempt(remove.mutateAsync(props.scannerId))) open.value = false;
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    :title="title"
    :description="description"
    :submit-label="editing ? 'Save changes' : 'Add scanner'"
    :pending="save.isPending.value"
    :read-only="builtIn"
    @submit="submit"
  >
    <FormSection no="01" title="Scanner" note="* Required attributes">
      <div class="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <FormInput
          :of="form"
          :path="['brand']"
          :disabled="builtIn"
          label="Brand"
          required
          placeholder="e.g. Noritsu, Frontier, Epson"
        />
        <FormInput
          :of="form"
          :path="['model']"
          :disabled="builtIn"
          label="Model"
          optional
          hint="Leave blank when the lab does not say. For a camera rig: body and lens"
          placeholder="e.g. V850, Flextight X5, A7R IV + 100mm"
        />
        <FormSelect
          :of="form"
          :path="['kind']"
          :disabled="builtIn"
          label="Kind"
          optional
          placeholder="Select a kind"
          :options="kindOptions"
        />
      </div>
    </FormSection>

    <FormSection no="02" title="Default scan settings" note="Each new order starts from these">
      <ScanSettingsFields
        v-model="defaultSettings"
        :options="options"
        :disabled="builtIn"
        id-prefix="scanner-default"
      />
    </FormSection>

    <FormSection no="03" title="Notes">
      <FormRichText
        :of="form"
        :path="['notes']"
        :disabled="builtIn"
        label="Notes"
        optional
        placeholder="Light source, film holder, conversion software…"
      >
        <template #aside>
          <span class="text-muted-foreground text-xs">Markdown shortcuts work</span>
        </template>
      </FormRichText>
    </FormSection>

    <template v-if="editing && !builtIn" #footer-start>
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
