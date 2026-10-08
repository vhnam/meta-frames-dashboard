<script setup lang="ts">
defineProps<{ title: string; description: string }>();
</script>

<template>
  <section class="bg-card text-card-foreground overflow-hidden rounded-lg border shadow-sm">
    <div class="grid h-1 grid-cols-4" aria-hidden="true">
      <span class="bg-primary" />
      <span class="bg-[oklch(0.3_0.09_38)]" />
      <span class="bg-primary/20" />
      <span class="bg-border" />
    </div>
    <div class="grid gap-6 p-6 sm:p-8">
      <div class="grid gap-1.5">
        <h1 class="font-heading text-2xl font-bold tracking-tight">{{ title }}</h1>
        <p class="text-muted-foreground text-sm">{{ description }}</p>
      </div>
      <slot />
    </div>
  </section>
</template>
