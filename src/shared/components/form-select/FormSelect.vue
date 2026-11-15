<script setup lang="ts" generic="TSchema extends FormSchema, TPath extends RequiredPath">
import { Field } from '@formisch/vue';
import type { FormSchema, FormStore, RequiredPath, ValidPath } from '@formisch/vue';
import type * as v from 'valibot';

import FormField from '../form-field/FormField.vue';
import SearchableSelect from '../searchable-select/SearchableSelect.vue';
import Select from '../select/Select.vue';
import type { Option } from '../select/Select.vue';

defineProps<{
  of: FormStore<TSchema>;
  path: ValidPath<v.InferInput<TSchema>, TPath>;
  label: string;
  options: Option[];
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  /** Store the option value as a number (undefined when cleared). */
  numeric?: boolean;
  /** Type to filter the options. */
  searchable?: boolean;
}>();
</script>

<template>
  <Field
    :of="of"
    :path="path"
    v-slot="field"
  >
    <FormField
      :label="label"
      :optional="optional"
      :required="required"
      :hint="hint"
      :error="field.errors?.[0]"
    >
      <template
        v-if="$slots.aside"
        #aside
        ><slot name="aside"
      /></template>
      <div class="flex min-w-0 gap-2 [&>[data-slot=select-trigger]]:min-w-0">
        <SearchableSelect
          v-if="searchable"
          :model-value="field.input == null ? '' : String(field.input)"
          :options="options"
          :placeholder="placeholder"
          :disabled="disabled"
          :invalid="!!field.errors"
          @update:model-value="(value) => (field.input = value as never)"
        />
        <Select
          v-else
          :model-value="field.input == null ? '' : String(field.input)"
          v-bind="field.props"
          :options="options"
          :placeholder="placeholder"
          :allow-empty="!!optional"
          :disabled="disabled"
          @update:model-value="
            (value) =>
              (field.input = (
                numeric ? (value === '' ? undefined : Number(value)) : value
              ) as never)
          "
        />
        <slot name="action" />
      </div>
    </FormField>
  </Field>
</template>
