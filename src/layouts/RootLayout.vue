<script setup lang="ts">
import { Outlet } from "@tanstack/vue-router";
import { Toaster } from "#/shared/ui/sonner";
</script>

<template>
  <Outlet />
  <Toaster />
</template>
