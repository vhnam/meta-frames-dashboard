<script setup lang="ts">
import { IconAperture } from "@tabler/icons-vue";
import { Link, Outlet } from "@tanstack/vue-router";
</script>

<template>
  <div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
    <div class="flex w-full max-w-sm flex-col gap-6">
      <Link to="/" class="font-heading flex items-center gap-2 self-center text-lg font-semibold">
        <span
          class="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md"
        >
          <IconAperture class="size-4" aria-hidden="true" />
        </span>
        Meta Frames
      </Link>
      <Outlet />
    </div>
  </div>
</template>
