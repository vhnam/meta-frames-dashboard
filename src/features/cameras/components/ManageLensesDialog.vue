<script setup lang="ts">
import { useLensList } from "#/features/lenses";
import { useCameraDetail, useSetCameraLenses } from "../queries";
import { computed, ref, watch } from "vue";
import PlainDialog from "#/shared/components/PlainDialog.vue";
import { attempt } from "#/shared/lib/ui";

const props = defineProps<{ cameraId: string }>();
const open = defineModel<boolean>("open", { required: true });

const detail = useCameraDetail(() => props.cameraId);
const lenses = useLensList();
const setLenses = useSetCameraLenses();

const selected = ref<string[]>([]);
watch(open, (isOpen) => {
  if (isOpen) selected.value = (detail.data.value?.lenses ?? []).map((lens) => lens.id);
});

/** Active, non-built-in lenses (plus any already selected); same mount first. */
const candidates = computed(() => {
  const mount = detail.data.value?.camera.mount;
  return (lenses.data.value ?? [])
    .map((row) => row.lens)
    .filter((lens) => !lens.builtInCameraId && (lens.active || selected.value.includes(lens.id)))
    .sort(
      (left, right) =>
        Number(right.mount === mount) - Number(left.mount === mount) ||
        left.focalLength - right.focalLength,
    );
});

async function submit() {
  if (await attempt(setLenses.mutateAsync({ cameraId: props.cameraId, lensIds: selected.value })))
    open.value = false;
}
</script>

<template>
  <PlainDialog
    v-model:open="open"
    title="Manage lenses"
    description="Lenses of the same mount are listed first."
    @submit="submit"
  >
    <p v-if="!candidates.length" class="text-muted-foreground text-sm">
      No lenses yet. Add lenses first.
    </p>
    <label v-for="lens in candidates" :key="lens.id" class="flex items-start gap-2 text-sm">
      <input v-model="selected" type="checkbox" :value="lens.id" class="mt-0.5" />
      <span class="grid gap-0.5">
        <span class="font-medium">{{ [lens.brand, lens.model].filter(Boolean).join(" ") }}</span>
        <span class="text-muted-foreground text-xs">
          {{ lens.focalLength }}mm f/{{ lens.maxAperture.toFixed(1) }} · {{ lens.mount }} mount{{
            lens.active ? "" : " · inactive"
          }}
        </span>
      </span>
    </label>
  </PlainDialog>
</template>
