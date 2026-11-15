<script setup lang="ts">
import { Button } from '#/shared/ui/button';

defineProps<{ pending?: boolean }>();
</script>

<template>
  <Button
    type="submit"
    class="h-11 w-full font-heading text-base font-bold tracking-[0.08em] uppercase"
    :disabled="pending"
  >
    <slot />
  </Button>
</template>
