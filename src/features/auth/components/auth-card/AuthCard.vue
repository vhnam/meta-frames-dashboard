<script setup lang="ts">
defineProps<{ title: string; description: string }>();
</script>

<template>
  <section class="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
    <div
      class="grid h-1 grid-cols-4"
      aria-hidden="true"
    >
      <span class="bg-primary" />
      <span class="bg-brand-stripe" />
      <span class="bg-primary/20" />
      <span class="bg-border" />
    </div>
    <div class="grid gap-6 p-6 sm:p-8">
      <div class="grid gap-1.5">
        <h1 class="font-heading text-2xl font-bold tracking-tight">{{ title }}</h1>
        <p class="text-sm text-muted-foreground">{{ description }}</p>
      </div>
      <slot />
    </div>
  </section>
</template>
