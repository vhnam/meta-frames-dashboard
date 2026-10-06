<script setup lang="ts">
import { computed } from "vue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";

export interface Option {
  value: string;
  label: string;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
    /** Offer the placeholder as a choosable "nothing" item. Off for required form fields. */
    allowEmpty?: boolean;
  }>(),
  { allowEmpty: true },
);
const model = defineModel<string>({ default: "" });

/** reka-ui rejects "" as an item value, so the "no selection" item gets a stand-in. */
const NONE = "__none__";
const hasNoneItem = computed(() => props.placeholder !== undefined && props.allowEmpty);
const value = computed({
  get: () => (model.value === "" ? (hasNoneItem.value ? NONE : undefined) : model.value),
  set: (v) => (model.value = v === NONE || v === undefined ? "" : String(v)),
});

/** Resolved from `options` rather than from the mounted items, so the label shows even
 * before the popup has rendered and when options arrive after the value. */
const selectedLabel = computed(() =>
  model.value === ""
    ? hasNoneItem.value
      ? props.placeholder
      : undefined
    : props.options.find((o) => o.value === model.value)?.label,
);
</script>

<template>
  <Select v-model="value" :disabled="disabled">
    <SelectTrigger v-bind="$attrs" class="w-full">
      <SelectValue :placeholder="placeholder">{{ selectedLabel ?? placeholder }}</SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-if="hasNoneItem" :value="NONE">{{ placeholder }}</SelectItem>
      <SelectItem v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</SelectItem>
    </SelectContent>
  </Select>
</template>
