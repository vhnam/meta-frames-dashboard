<script setup lang="ts">
import { Link } from "@tanstack/vue-router";
</script>

<template>
  <Link to="/" class="flex items-center gap-3">
    <img src="/logo.png" alt="" class="size-10 rounded-md shadow-sm" />
    <span class="grid leading-tight">
      <span class="font-heading text-lg font-bold tracking-wide uppercase">Meta Frames</span>
      <span class="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
        Film tracker
      </span>
    </span>
  </Link>
</template>
