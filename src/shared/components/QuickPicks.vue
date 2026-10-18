<script setup lang="ts">
import { cn } from "#/shared/lib/utils";

/** Small chips beside a number field's label that fill in a common value. */
defineProps<{
  values: readonly number[];
  current: unknown;
  label: string;
  format?: (value: number) => string;
}>();
const emit = defineEmits<{ pick: [value: number] }>();
</script>

<template>
  <div class="flex gap-1.5" role="group" :aria-label="label">
    <button
      v-for="value in values"
      :key="value"
      type="button"
      :aria-pressed="Number(current) === value"
      :class="
        cn(
          'rounded-sm border px-1.5 py-0.5 text-[0.7rem] leading-none transition-colors',
          Number(current) === value
            ? 'border-primary/60 bg-primary/10 text-primary'
            : 'bg-secondary text-muted-foreground hover:text-foreground border-transparent',
        )
      "
      @click="emit('pick', value)"
    >
      {{ format ? format(value) : value }}
    </button>
  </div>
</template>
