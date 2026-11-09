<script setup lang="ts">
import type { Lens } from "#/features/lenses";
import { useSetRollLenses } from "../queries";
import { useForm } from "@formisch/vue";
import * as v from "valibot";
import { ref, watch } from "vue";
import { Checkbox } from "#/shared/ui/checkbox";
import FormSection from "#/shared/components/FormSection.vue";
import SectionedFormDialog from "#/shared/components/SectionedFormDialog.vue";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{
  rollId: string;
  cameraName?: string;
  /** Lenses that fit the roll's camera. */
  candidates: Lens[];
  /** Lenses currently used on the roll. */
  selectedIds: string[];
}>();
const open = defineModel<boolean>("open", { required: true });

const setLenses = useSetRollLenses();
// The dialog needs a form for its shell; the ticked lenses live beside it, as in LabFormDialog.
const form = useForm({ schema: v.object({}) });

const selected = ref<string[]>([]);
watch(open, (isOpen) => {
  if (isOpen) selected.value = [...props.selectedIds];
});

function toggle(id: string, on: boolean) {
  selected.value = on ? [...selected.value, id] : selected.value.filter((lensId) => lensId !== id);
}

async function submit() {
  if (await attempt(setLenses.mutateAsync({ id: props.rollId, lensIds: selected.value })))
    open.value = false;
}
</script>

<template>
  <SectionedFormDialog
    v-model:open="open"
    :form="form"
    size="md"
    title="Manage Lenses"
    :description="
      cameraName
        ? `The lenses used on this roll, from those linked to ${cameraName}`
        : 'The lenses used on this roll'
    "
    :pending="setLenses.isPending.value"
    @submit="submit"
  >
    <FormSection no="01" title="Lenses" :note="`${selected.length} selected`">
      <p v-if="!candidates.length" class="text-muted-foreground text-sm">
        The camera has no lenses yet. Link lenses to it first.
      </p>
      <fieldset v-else class="grid min-w-0 gap-2">
        <legend class="sr-only">Lenses</legend>
        <label
          v-for="lens in candidates"
          :key="lens.id"
          class="dark:bg-input/30 flex min-h-11 min-w-0 cursor-pointer items-center gap-3 rounded-md border bg-white px-3 py-2 text-sm"
        >
          <Checkbox
            :model-value="selected.includes(lens.id)"
            @update:model-value="(on) => toggle(lens.id, on === true)"
          />
          <span class="grid min-w-0">
            <span class="font-heading truncate text-base">
              {{ [lens.brand, lens.model].filter(Boolean).join(" ") }}
            </span>
            <span class="text-muted-foreground text-xs">{{ lens.mount }} mount</span>
          </span>
        </label>
      </fieldset>
    </FormSection>
  </SectionedFormDialog>
</template>
