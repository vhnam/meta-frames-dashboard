<script setup lang="ts" generic="TSchema extends FormSchema, TPath extends RequiredPath">
import { Field } from "@formisch/vue";
import type { FormSchema, FormStore, RequiredPath, ValidPath } from "@formisch/vue";
import type * as v from "valibot";
import { defineAsyncComponent } from "vue";
import FormField from "./FormField.vue";

// TipTap is large: load it only when a form with notes opens.
const RichTextEditor = defineAsyncComponent(() => import("./RichTextEditor.vue"));

defineProps<{
  of: FormStore<TSchema>;
  path: ValidPath<v.InferInput<TSchema>, TPath>;
  label: string;
  optional?: boolean;
  required?: boolean;
  hint?: string;
  placeholder?: string;
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
      <RichTextEditor
        :model-value="(field.input as string | undefined) ?? ''"
        :placeholder="placeholder"
        :disabled="disabled"
        @update:model-value="(value) => (field.input = value as never)"
      />
    </FormField>
  </Field>
</template>
