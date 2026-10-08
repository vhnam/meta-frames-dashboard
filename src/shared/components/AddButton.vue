<script setup lang="ts">
import { IconPlus } from "@tabler/icons-vue";
import { Button } from "#/shared/ui/button";
</script>

<template>
  <!-- the primary "Add …" action in a page header -->
  <Button size="lg" class="h-11 px-5 shadow-sm">
    <IconPlus aria-hidden="true" />
    <slot />
  </Button>
</template>
