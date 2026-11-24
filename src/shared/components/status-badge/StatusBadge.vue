<script setup lang="ts">
import { cn } from '#/shared/lib/utils';

export type StatusTone = 'neutral' | 'muted' | 'accent' | 'warning' | 'success' | 'info' | 'danger';

defineProps<{ tone?: StatusTone }>();

const TONE: Record<StatusTone, string> = {
  neutral: 'bg-badge-neutral-bg text-badge-neutral-fg [&>i]:bg-badge-neutral-fg',
  muted: 'bg-badge-neutral-bg text-badge-neutral-fg [&>i]:bg-badge-neutral-fg',
  accent: 'bg-badge-info-bg text-badge-info-fg [&>i]:bg-badge-info-fg',
  warning: 'bg-badge-warning-bg text-badge-warning-fg [&>i]:bg-badge-warning-fg',
  success: 'bg-badge-success-bg text-badge-success-fg [&>i]:bg-badge-success-fg',
  info: 'bg-badge-info-bg text-badge-info-fg [&>i]:bg-badge-info-fg',
  danger: 'bg-badge-danger-bg text-badge-danger-fg [&>i]:bg-badge-danger-fg',
};
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex h-7 items-center gap-2 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap shadow-xs',
        tone && Object.hasOwn(TONE, tone) ? TONE[tone] : TONE.neutral,
      )
    "
  >
    <i
      class="size-1.5 rounded-full"
      aria-hidden="true"
    />
    <slot />
  </span>
</template>
