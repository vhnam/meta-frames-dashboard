<script setup lang="ts" generic="TSchema extends FormSchema, TPath extends RequiredPath">
import { Field } from "@formisch/vue";
import type { FormSchema, FormStore, RequiredPath, ValidPath } from "@formisch/vue";
import type * as v from "valibot";
import FormField from "./FormField.vue";
import Select from "./Select.vue";
import type { Option } from "./Select.vue";

defineProps<{
  of: FormStore<TSchema>;
  path: ValidPath<v.InferInput<TSchema>, TPath>;
  label: string;
  options: Option[];
  placeholder?: string;
  optional?: boolean;
  hint?: string;
  disabled?: boolean;
}>();
</script>

<template>
  <Field :of="of" :path="path" v-slot="field">
    <FormField :label="label" :optional="optional" :hint="hint" :error="field.errors?.[0]">
      <div class="flex gap-2">
        <Select
          :model-value="(field.input as string | undefined) ?? ''"
          v-bind="field.props"
          :options="options"
          :placeholder="placeholder"
          :allow-empty="!!optional"
          :disabled="disabled"
          @update:model-value="(x) => (field.input = x as never)"
        />
        <slot name="action" />
      </div>
    </FormField>
  </Field>
</template>
