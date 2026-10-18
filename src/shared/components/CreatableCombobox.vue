<script setup lang="ts">
import { IconCheck, IconPlus, IconSelector } from "@tabler/icons-vue";
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
} from "reka-ui";
import { computed, ref, watch } from "vue";
import type { ComboOption } from "./combobox";

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
const model = defineModel<string>({ default: "" });

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
        class="placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 w-full min-w-0 rounded-md border bg-transparent py-1 pr-10 pl-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        @blur="commit"
      />
      <ComboboxTrigger
        class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center"
        :aria-label="`Show ${noun ?? 'option'}s`"
      >
        <IconSelector class="size-4" aria-hidden="true" />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxPortal>
      <ComboboxContent
        position="popper"
        :side-offset="4"
        class="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50 w-(--reka-combobox-trigger-width) min-w-[8rem] overflow-hidden rounded-md border shadow-md"
      >
        <ComboboxViewport class="max-h-60 overflow-y-auto p-1">
          <ComboboxItem
            v-for="option in filtered"
            :key="option.value"
            :value="option.value"
            class="data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none"
          >
            <span class="min-w-0 flex-1 truncate">{{ option.value }}</span>
            <span
              v-if="option.count"
              class="text-muted-foreground ml-3 text-xs tabular-nums"
              :aria-label="`used by ${option.count}`"
            >
              {{ option.count }}
            </span>
            <ComboboxItemIndicator class="absolute right-2 flex items-center">
              <IconCheck class="size-4" aria-hidden="true" />
            </ComboboxItemIndicator>
          </ComboboxItem>
          <ComboboxItem
            v-if="canCreate"
            :value="query"
            class="text-primary data-[highlighted]:bg-primary/10 flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none"
          >
            <IconPlus class="size-4" aria-hidden="true" />
            Add {{ noun ?? "" }} “{{ query }}”
          </ComboboxItem>
          <ComboboxEmpty class="text-muted-foreground px-2 py-1.5 text-sm">
            No {{ noun ?? "option" }}s yet. Type one to add it.
          </ComboboxEmpty>
          <!-- without this, adding a new value is invisible until the text differs -->
          <p
            v-if="filtered.length && !canCreate"
            class="text-muted-foreground mt-1 border-t px-2 pt-2 pb-1 text-xs"
          >
            Not listed? Type a new {{ noun ?? "value" }} to add it.
          </p>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
