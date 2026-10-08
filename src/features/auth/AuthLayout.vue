<script setup lang="ts">
import { Outlet } from "@tanstack/vue-router";
import BrandLink from "#/shared/components/BrandLink.vue";
</script>

<template>
  <div class="bg-background flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-10">
    <BrandLink />
    <div class="w-full max-w-md">
      <Outlet />
    </div>
  </div>
</template>
