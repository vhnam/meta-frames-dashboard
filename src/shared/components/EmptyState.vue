<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<template>
  <div class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
    {{ text }}
  </div>
</template>
