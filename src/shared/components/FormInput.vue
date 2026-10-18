<script setup lang="ts" generic="TSchema extends FormSchema, TPath extends RequiredPath">
import { Field } from "@formisch/vue";
import type { FormSchema, FormStore, RequiredPath, ValidPath } from "@formisch/vue";
import type * as v from "valibot";
import { Input } from "#/shared/ui/input";
import { Textarea } from "#/shared/ui/textarea";
import FormField from "./FormField.vue";

defineProps<{
  of: FormStore<TSchema>;
  path: ValidPath<v.InferInput<TSchema>, TPath>;
  label: string;
  optional?: boolean;
  required?: boolean;
  hint?: string;
  /** Unit text shown inside the input's right edge, e.g. "ASA/ISO". */
  suffix?: string;
  type?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  list?: string;
  multiline?: boolean;
  placeholder?: string;
  autocomplete?: string;
  disabled?: boolean;
}>();
</script>

<template>
  <Field :of="of" :path="path" v-slot="field">
    <FormField
      :label="label"
      :optional="optional"
      :required="required"
      :hint="hint"
      :error="field.errors?.[0]"
    >
      <template v-if="$slots.aside" #aside><slot name="aside" /></template>
      <Textarea
        v-if="multiline"
        :model-value="field.input as string"
        v-bind="field.props"
        :placeholder="placeholder"
        :disabled="disabled"
        @update:model-value="(value) => (field.input = value as never)"
      />
      <div v-else class="relative">
        <Input
          :model-value="field.input as string | number | undefined"
          v-bind="field.props"
          :type="type"
          :min="min"
          :max="max"
          :step="step"
          :list="list"
          :placeholder="placeholder"
          :autocomplete="autocomplete"
          :disabled="disabled"
          :aria-invalid="!!field.errors"
          :class="suffix ? 'pr-20' : undefined"
          @update:model-value="(value) => (field.input = value as never)"
        />
        <span
          v-if="suffix"
          class="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs"
          aria-hidden="true"
        >
          {{ suffix }}
        </span>
      </div>
    </FormField>
  </Field>
</template>
