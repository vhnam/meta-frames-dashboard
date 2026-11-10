<script setup lang="ts">
import { computed, onBeforeUnmount, watchEffect, ref } from "vue";
import { useScanFile } from "../queries";

const props = defineProps<{ scanId: string; alt: string }>();

const file = useScanFile(() => props.scanId);
const url = ref<string>();

// one object URL per loaded blob, released when it changes or the image goes away
watchEffect((onCleanup) => {
  const blob = file.data.value;
  if (!blob) return;
  const objectUrl = URL.createObjectURL(blob);
  url.value = objectUrl;
  onCleanup(() => URL.revokeObjectURL(objectUrl));
});
onBeforeUnmount(() => (url.value = undefined));

const failed = computed(() => file.isError.value);
</script>

<template>
  <a v-if="url" :href="url" target="_blank" rel="noopener" class="block">
    <img :src="url" :alt="alt" class="max-h-80 w-full rounded-md border object-contain" />
  </a>
  <p v-else-if="failed" class="text-destructive text-sm">The image could not be loaded.</p>
  <p v-else class="text-muted-foreground text-sm">Loading…</p>
</template>
