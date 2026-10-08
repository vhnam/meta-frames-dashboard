<script setup lang="ts">
import { cn } from "#/shared/lib/utils";

export type StatusTone = "neutral" | "muted" | "accent" | "warning" | "success" | "info" | "danger";

defineProps<{ tone?: StatusTone }>();

const TONE: Record<StatusTone, string> = {
  neutral: "bg-secondary text-secondary-foreground [&>i]:bg-foreground/60",
  muted: "bg-card text-muted-foreground [&>i]:bg-muted-foreground/60",
  accent: "border-primary/30 bg-primary/10 text-primary [&>i]:bg-primary",
  warning:
    "border-amber-200 bg-amber-100 text-amber-950 [&>i]:bg-amber-600 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 [&>i]:bg-emerald-600 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  info: "border-sky-200 bg-sky-50 text-sky-900 [&>i]:bg-sky-600 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100",
  danger: "border-destructive bg-destructive text-white [&>i]:bg-white",
};
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex h-7 items-center gap-2 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap shadow-xs',
        TONE[tone ?? 'neutral'],
      )
    "
  >
    <i class="size-1.5 rounded-full" aria-hidden="true" />
    <slot />
  </span>
</template>
