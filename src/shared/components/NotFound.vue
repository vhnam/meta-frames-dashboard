<script setup lang="ts">
import { IconMapOff } from "@tabler/icons-vue";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/shared/ui/empty";

/** The 404 body. The default slot holds the way back, e.g. a Link styled as a Button. */
withDefaults(defineProps<{ description?: string }>(), {
  description: "The page you're looking for doesn't exist or has moved.",
});
</script>

<template>
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <IconMapOff aria-hidden="true" />
      </EmptyMedia>
      <p class="text-primary font-heading text-xs font-semibold tracking-[0.16em] uppercase">
        Error 404
      </p>
      <EmptyTitle>
        <h1 class="text-3xl font-semibold tracking-tight md:text-4xl">Page not found</h1>
      </EmptyTitle>
      <EmptyDescription>{{ description }}</EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="$slots.default">
      <slot />
    </EmptyContent>
  </Empty>
</template>
