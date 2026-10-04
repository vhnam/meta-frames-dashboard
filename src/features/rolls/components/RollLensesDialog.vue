<script setup lang="ts">
import type { Lens } from "#/features/lenses";
import { useSetRollLenses } from "../queries";
import { ref, watch } from "vue";
import { Checkbox } from "#/shared/ui/checkbox";
import PlainDialog from "#/shared/components/PlainDialog.vue";
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

const selected = ref<string[]>([]);
watch(open, (isOpen) => {
  if (isOpen) selected.value = [...props.selectedIds];
});

async function submit() {
  if (await attempt(setLenses.mutateAsync({ id: props.rollId, lensIds: selected.value })))
    open.value = false;
}
</script>

<template>
  <PlainDialog
    v-model:open="open"
    title="Manage lenses"
    :description="cameraName ? `Camera: ${cameraName}` : undefined"
    @submit="submit"
  >
    <p v-if="!candidates.length" class="text-muted-foreground text-sm">
      The camera has no lenses yet. Link lenses to it first.
    </p>
    <label v-for="l in candidates" :key="l.id" class="flex items-start gap-3 text-sm">
      <Checkbox
        class="mt-0.5"
        :model-value="selected.includes(l.id)"
        @update:model-value="
          (on) => (selected = on ? [...selected, l.id] : selected.filter((id) => id !== l.id))
        "
      />
      <span class="grid">
        <span>{{ [l.brand, l.model].filter(Boolean).join(" ") }}</span>
        <span class="text-muted-foreground text-xs">{{ l.mount }} mount</span>
      </span>
    </label>
  </PlainDialog>
</template>
