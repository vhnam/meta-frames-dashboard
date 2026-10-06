<script setup lang="ts">
import { IconSearch, IconX } from "@tabler/icons-vue";
import { Input } from "#/shared/ui/input";
import FilterField from "./FilterField.vue";

defineProps<{ label: string; placeholder?: string }>();
const model = defineModel<string>({ default: "" });
</script>

<template>
  <FilterField v-slot="{ id }" :label="label" class="sm:w-64">
    <div class="relative">
      <IconSearch
        class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        :id="id"
        v-model="model"
        type="text"
        class="pr-9 pl-9"
        :placeholder="placeholder ?? 'Search…'"
      />
      <button
        v-if="model"
        type="button"
        class="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-1"
        aria-label="Clear search"
        @click="model = ''"
      >
        <IconX class="size-3.5" />
      </button>
    </div>
  </FilterField>
</template>
