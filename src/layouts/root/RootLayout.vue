<script setup lang="ts">
import { Outlet } from '@tanstack/vue-router';

import ConfirmDialog from '#/shared/components/confirm-dialog/ConfirmDialog.vue';
import { Toaster } from '#/shared/ui/sonner';
</script>

<template>
  <!-- Toaster first: it subscribes in setup, so a toast from the first page's setup error needs it -->
  <Toaster />
  <Outlet />
  <ConfirmDialog />
</template>
