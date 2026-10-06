<script setup lang="ts">
import { lensName, useLensList } from "#/features/lenses";
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
  if (isOpen) selected.value = (detail.data.value?.lenses ?? []).map((l) => l.id);
});

/** Active, non-built-in lenses (plus any already selected); same mount first. */
const candidates = computed(() => {
  const mount = detail.data.value?.camera.mount;
  return (lenses.data.value ?? [])
    .map((r) => r.lens)
    .filter((l) => !l.builtInCameraId && (l.active || selected.value.includes(l.id)))
    .sort(
      (a, b) =>
        Number(b.mount === mount) - Number(a.mount === mount) || a.focalLength - b.focalLength,
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
    <label v-for="l in candidates" :key="l.id" class="flex items-center gap-2 text-sm">
      <input v-model="selected" type="checkbox" :value="l.id" />
      <span>{{ lensName(l) }}</span>
      <span class="text-muted-foreground text-xs"
        >{{ l.mount }}{{ l.active ? "" : " · inactive" }}</span
      >
    </label>
  </PlainDialog>
</template>
