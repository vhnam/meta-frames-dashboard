<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<template>
  <div class="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
    {{ text }}
  </div>
</template>
