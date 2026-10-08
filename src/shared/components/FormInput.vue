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
  hint?: string;
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
    <FormField :label="label" :optional="optional" :hint="hint" :error="field.errors?.[0]">
      <Textarea
        v-if="multiline"
        :model-value="field.input as string"
        v-bind="field.props"
        :placeholder="placeholder"
        :disabled="disabled"
        @update:model-value="(x) => (field.input = x as never)"
      />
      <Input
        v-else
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
        @update:model-value="(x) => (field.input = x as never)"
      />
    </FormField>
  </Field>
</template>
