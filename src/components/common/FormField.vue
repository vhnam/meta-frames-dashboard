<script setup lang="ts">
import { Label } from "#/components/ui/label";

defineProps<{ label: string; hint?: string; optional?: boolean; error?: string }>();
</script>

<template>
  <div class="grid content-start gap-1.5">
    <Label>
      {{ label }}
      <em v-if="optional" class="text-muted-foreground font-normal italic">(optional)</em>
    </Label>
    <slot />
    <p v-if="hint" class="text-muted-foreground text-xs">{{ hint }}</p>
    <p v-if="error" class="text-destructive text-xs" role="alert">{{ error }}</p>
  </div>
</template>
