<script setup lang="ts">
import { IconCheck, IconPlus, IconSelector } from '@tabler/icons-vue';
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

import type { ComboOption } from './combobox';

/**
 * Pick one of the known values or type a new one ("+ Add “L39”"). Text typed and left without
 * picking is kept too, so a new value never needs an extra step.
 */
const props = defineProps<{
  options: readonly ComboOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Noun for the add row and empty state, e.g. "mount". */
  noun?: string;
  invalid?: boolean;
}>();
const model = defineModel<string>({ default: '' });

const open = ref(false);
const term = ref(model.value);
watch(model, (value) => (term.value = value));

const query = computed(() => term.value.trim());
const filtered = computed(() => {
  const needle = query.value.toLowerCase();
  // the full list while the text is still the chosen value, so other values stay one click away
  if (!needle || query.value === model.value) return props.options;
  return props.options.filter((option) => option.value.toLowerCase().includes(needle));
});
const canCreate = computed(
  () =>
    !!query.value &&
    !props.options.some((option) => option.value.toLowerCase() === query.value.toLowerCase()),
);

function commit() {
  if (query.value !== model.value) model.value = query.value;
}
</script>

<template>
  <ComboboxRoot
    v-model="model"
    v-model:open="open"
    :disabled="disabled"
    ignore-filter
    open-on-click
    :reset-search-term-on-blur="false"
  >
    <ComboboxAnchor class="relative">
      <ComboboxInput
        v-model="term"
        data-slot="input"
        :display-value="(v: string) => v ?? ''"
        :placeholder="placeholder"
        :aria-invalid="invalid || undefined"
        class="h-9 w-full min-w-0 rounded-md border border-input bg-transparent py-1 pr-10 pl-3 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40"
        @blur="commit"
      />
      <ComboboxTrigger
        class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        :aria-label="`Show ${noun ?? 'option'}s`"
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
        class="z-50 w-(--reka-combobox-trigger-width) min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      >
        <ComboboxViewport class="max-h-60 overflow-y-auto p-1">
          <ComboboxItem
            v-for="option in filtered"
            :key="option.value"
            :value="option.value"
            class="relative flex cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <span class="min-w-0 flex-1 truncate">{{ option.value }}</span>
            <span
              v-if="option.count"
              class="ml-3 text-xs text-muted-foreground tabular-nums"
              :aria-label="`used by ${option.count}`"
            >
              {{ option.count }}
            </span>
            <ComboboxItemIndicator class="absolute right-2 flex items-center">
              <IconCheck
                class="size-4"
                aria-hidden="true"
              />
            </ComboboxItemIndicator>
          </ComboboxItem>
          <ComboboxItem
            v-if="canCreate"
            :value="query"
            class="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary outline-hidden select-none data-[highlighted]:bg-primary/10"
          >
            <IconPlus
              class="size-4"
              aria-hidden="true"
            />
            Add {{ noun ?? '' }} “{{ query }}”
          </ComboboxItem>
          <ComboboxEmpty class="px-2 py-1.5 text-sm text-muted-foreground">
            No {{ noun ?? 'option' }}s yet. Type one to add it.
          </ComboboxEmpty>
          <!-- without this, adding a new value is invisible until the text differs -->
          <p
            v-if="filtered.length && !canCreate"
            class="mt-1 border-t px-2 pt-2 pb-1 text-xs text-muted-foreground"
          >
            Not listed? Type a new {{ noun ?? 'value' }} to add it.
          </p>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
