<script setup lang="ts" generic="TSchema extends FormSchema, TPath extends RequiredPath">
import { Field } from "@formisch/vue";
import type { FormSchema, FormStore, RequiredPath, ValidPath } from "@formisch/vue";
import type * as v from "valibot";
import type { ComboOption } from "./combobox";
import CreatableCombobox from "./CreatableCombobox.vue";
import FormField from "./FormField.vue";

defineProps<{
  of: FormStore<TSchema>;
  path: ValidPath<v.InferInput<TSchema>, TPath>;
  label: string;
  options: readonly ComboOption[];
  noun?: string;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  hint?: string;
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
      <CreatableCombobox
        :model-value="(field.input as string | undefined) ?? ''"
        :options="options"
        :noun="noun"
        :placeholder="placeholder"
        :disabled="disabled"
        :invalid="!!field.errors"
        @update:model-value="(x) => (field.input = x as never)"
      />
    </FormField>
  </Field>
</template>
