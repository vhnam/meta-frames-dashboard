<script setup lang="ts">
import { IconCheck, IconSelector } from '@tabler/icons-vue';
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui';
import { computed, ref, watch } from 'vue';

import type { Option } from '../select/Select.vue';

/** Pick one option by typing to filter its label; unlike CreatableCombobox, no new value is allowed. */
const props = defineProps<{
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** `id` of the text input, so a label can point to it. */
  inputId?: string;
  /** `id` of the error text; set as `aria-describedby` of the input. */
  errorId?: string;
}>();
const model = defineModel<string>({ default: '' });

const term = ref('');
// true once the user types; until then the full list shows
const typed = ref(false);
const selectedLabel = computed(
  () => props.options.find((option) => option.value === model.value)?.label ?? '',
);
// also covers options arriving after the value
watch(
  selectedLabel,
  (label) => {
    term.value = label;
    typed.value = false;
  },
  { immediate: true },
);

const filtered = computed(() => {
  const needle = term.value.trim().toLowerCase();
  if (!needle || !typed.value) return props.options;
  return props.options.filter((option) => option.label.toLowerCase().includes(needle));
});

const open = ref(false);
/** Closing with half-typed text restores the chosen label, as no free text is accepted.
 * Not on blur: that fires on mouse-down on an option, and a changed list loses the click. */
watch(open, (isOpen) => {
  if (isOpen) return;
  term.value = selectedLabel.value;
  typed.value = false;
});
</script>

<template>
  <ComboboxRoot
    v-model="model"
    v-model:open="open"
    class="min-w-0 flex-1"
    :disabled="disabled"
    ignore-filter
    open-on-click
    :reset-search-term-on-blur="false"
  >
    <ComboboxAnchor class="relative">
      <ComboboxInput
        v-model="term"
        :id="inputId"
        data-slot="input"
        :display-value="() => term"
        :placeholder="placeholder"
        :aria-invalid="invalid || undefined"
        :aria-describedby="errorId"
        class="h-9 w-full min-w-0 rounded-md border border-input bg-transparent py-1 pr-10 pl-3 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40"
        @input="typed = true"
      />
      <ComboboxTrigger
        class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label="Show options"
      >
        <IconSelector
          class="size-4"
          aria-hidden="true"
        />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxPortal>
      <ComboboxContent
        position="popper"
        :side-offset="4"
        class="z-50 w-(--reka-combobox-trigger-width) min-w-32 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      >
        <ComboboxViewport class="max-h-60 scroll-fade overflow-y-auto p-1">
          <ComboboxItem
            v-for="option in filtered"
            :key="option.value"
            :value="option.value"
            class="relative flex cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
          >
            <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
            <ComboboxItemIndicator class="absolute right-2 flex items-center">
              <IconCheck
                class="size-4"
                aria-hidden="true"
              />
            </ComboboxItemIndicator>
          </ComboboxItem>
          <ComboboxEmpty
            v-if="!filtered.length"
            class="px-2 py-1.5 text-sm text-muted-foreground"
          >
            No match.
          </ComboboxEmpty>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
