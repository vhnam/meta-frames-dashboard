<script setup lang="ts">
import { Card, CardContent } from "#/components/ui/card";
</script>

<template>
  <Card class="mb-4">
    <CardContent class="flex flex-wrap items-end gap-4">
      <slot />
    </CardContent>
  </Card>
</template>
