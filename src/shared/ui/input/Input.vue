<script setup lang="ts">
import { useVModel } from '@vueuse/core';
import type { HTMLAttributes } from 'vue';

import { cn } from '#/shared/lib/utils';

import { inputBoxClasses, inputFocusVariants } from '.';

const props = defineProps<{
  defaultValue?: string | number;
  modelValue?: string | number;
  class?: HTMLAttributes['class'];
}>();

const emits = defineEmits<{
  (event: 'update:modelValue', payload: string | number): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <input
    v-model="modelValue"
    data-slot="input"
    :class="
      cn(
        inputBoxClasses,
        'px-3 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        inputFocusVariants(),
        props.class,
      )
    "
  />
</template>
