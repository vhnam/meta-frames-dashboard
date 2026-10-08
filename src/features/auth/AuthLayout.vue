<script setup lang="ts">
import { IconAperture } from "@tabler/icons-vue";
import { Link, Outlet } from "@tanstack/vue-router";
</script>

<template>
  <div class="bg-background flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-10">
    <Link to="/" class="flex items-center gap-3">
      <span
        class="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-md shadow-sm"
      >
        <IconAperture class="size-6" aria-hidden="true" />
      </span>
      <span class="grid leading-tight">
        <span class="font-heading text-lg font-bold tracking-wide uppercase">Meta Frames</span>
        <span class="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
          Film tracker
        </span>
      </span>
    </Link>
    <div class="w-full max-w-md">
      <Outlet />
    </div>
  </div>
</template>
