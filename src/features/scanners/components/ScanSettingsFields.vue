<script setup lang="ts">
import type { ScanOption, ScanSettings } from "../types";
import Select from "#/shared/components/Select.vue";
import { Checkbox } from "#/shared/ui/checkbox";
import { Input } from "#/shared/ui/input";

/** A field per scan option of a scanner kind, editing a settings object. */
const props = defineProps<{ options: ScanOption[]; idPrefix: string; disabled?: boolean }>();
const settings = defineModel<ScanSettings>({ required: true });

const valueOf = (option: ScanOption) => settings.value[option.key] ?? option.default;
function set(option: ScanOption, value: string | number | boolean) {
  settings.value = { ...settings.value, [option.key]: value };
}
function setInteger(option: ScanOption, text: string | number) {
  const number = Number(text);
  if (text !== "" && Number.isInteger(number)) set(option, number);
}
const choices = (option: ScanOption) => option.values ?? [];
const fieldId = (option: ScanOption) => `${props.idPrefix}-${option.key}`;
</script>

<template>
  <div class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
    <template v-for="option in props.options" :key="option.key">
      <label v-if="option.type === 'boolean'" class="flex items-center gap-2 text-sm sm:col-span-2">
        <Checkbox
          :model-value="valueOf(option) === true"
          :disabled="props.disabled"
          @update:model-value="(on) => set(option, on === true)"
        />
        {{ option.label }}
      </label>
      <div v-else class="grid gap-1.5">
        <label :for="fieldId(option)" class="text-muted-foreground text-xs">{{
          option.label
        }}</label>
        <Select
          v-if="option.type === 'enum'"
          :id="fieldId(option)"
          :model-value="String(valueOf(option))"
          :options="choices(option)"
          :allow-empty="false"
          :disabled="props.disabled"
          :aria-label="option.label"
          @update:model-value="(value) => set(option, value)"
        />
        <Input
          v-else
          :id="fieldId(option)"
          type="number"
          :min="option.min"
          :max="option.max"
          step="1"
          :disabled="props.disabled"
          :model-value="Number(valueOf(option))"
          :aria-label="option.label"
          @update:model-value="(value) => setInteger(option, value)"
        />
      </div>
    </template>
    <p v-if="!props.options.length" class="text-muted-foreground text-xs sm:col-span-2">
      No options for this scanner.
    </p>
  </div>
</template>
