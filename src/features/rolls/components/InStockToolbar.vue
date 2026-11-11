<script setup lang="ts">
import { useId } from "vue";
import { Label } from "#/shared/ui/label";
import { Switch } from "#/shared/ui/switch";

/** The In stock view switch, shown beside the table search like Hand to lab on other tabs. */
defineProps<{ grouped: boolean }>();
const emit = defineEmits<{ "update:grouped": [value: boolean] }>();

const groupId = useId();
</script>

<template>
  <div class="flex h-11 shrink-0 items-center gap-2">
    <Switch
      :id="groupId"
      :model-value="grouped"
      @update:model-value="(value) => emit('update:grouped', value)"
    />
    <Label :for="groupId">Group by stock</Label>
  </div>
</template>
