<script setup lang="ts">
import { Outlet } from '@tanstack/vue-router';

import ConfirmDialog from '#/shared/components/confirm-dialog/ConfirmDialog.vue';
import { Toaster } from '#/shared/ui/sonner';
</script>

<template>
  <Outlet />
  <Toaster />
  <ConfirmDialog />
</template>
