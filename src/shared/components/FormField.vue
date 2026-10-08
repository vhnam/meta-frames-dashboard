<script setup lang="ts">
import { Label } from "#/shared/ui/label";

defineProps<{
  label: string;
  hint?: string;
  optional?: boolean;
  /** Mark the label with an asterisk. Validation still comes from the schema. */
  required?: boolean;
  error?: string;
}>();
</script>

<template>
  <div class="grid content-start gap-1.5">
    <div class="flex items-center justify-between gap-3">
      <Label>
        {{ label }}
        <span v-if="required" class="text-primary -ml-1.5" aria-hidden="true">*</span>
        <em v-if="optional" class="text-muted-foreground font-normal italic">(optional)</em>
      </Label>
      <!-- right side of the label row: an example, quick picks, an action -->
      <slot name="aside" />
    </div>
    <slot />
    <p v-if="hint" class="text-muted-foreground text-xs">{{ hint }}</p>
    <p v-if="error" class="text-destructive text-xs" role="alert">{{ error }}</p>
  </div>
</template>
