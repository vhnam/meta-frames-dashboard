<script setup lang="ts">
import { useId } from "vue";
import { Label } from "#/components/ui/label";

defineProps<{ label: string }>();
const id = useId();
</script>

<template>
  <div class="grid w-full gap-1.5 sm:w-48">
    <Label :for="id">{{ label }}</Label>
    <slot :id="id" />
  </div>
</template>
