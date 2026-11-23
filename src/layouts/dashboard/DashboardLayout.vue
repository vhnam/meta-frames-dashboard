<script setup lang="ts">
import { Outlet } from '@tanstack/vue-router';

import { SidebarInset, SidebarProvider } from '#/shared/ui/sidebar';

import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="min-w-0 bg-background bg-dots">
      <AppHeader />
      <div class="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
        <Outlet />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
