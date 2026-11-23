<script setup lang="ts">
import { useId } from 'vue';

import { Label } from '#/shared/ui/label';

const props = defineProps<{
  label: string;
  hint?: string;
  optional?: boolean;
  /** Mark the label with an asterisk. Validation still comes from the schema. */
  required?: boolean;
  error?: string;
}>();

const id = useId();
const errorId = `${id}-error`;
const labelId = `${id}-label`;
</script>

<template>
  <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-1.5">
    <div class="flex items-center justify-between gap-3">
      <Label
        :id="labelId"
        :for="id"
      >
        {{ label }}
        <span
          v-if="required"
          class="-ml-1.5 text-primary"
          aria-hidden="true"
          >*</span
        >
        <em
          v-if="optional"
          class="font-normal text-muted-foreground italic"
          >(optional)</em
        >
      </Label>
      <!-- right side of the label row: an example, quick picks, an action -->
      <slot name="aside" />
    </div>
    <slot
      :id="id"
      :label-id="labelId"
      :error-id="props.error ? errorId : undefined"
    />
    <p
      v-if="hint"
      class="text-xs text-muted-foreground"
    >
      {{ hint }}
    </p>
    <p
      v-if="error"
      :id="errorId"
      class="text-xs text-destructive"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>
