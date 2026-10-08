<script setup lang="ts">
import { Outlet } from "@tanstack/vue-router";
import { SidebarInset, SidebarProvider } from "#/shared/ui/sidebar";
import AppSidebar from "./AppSidebar.vue";
import AppHeader from "./AppHeader.vue";
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="bg-background bg-dots min-w-0">
      <AppHeader />
      <main class="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
        <Outlet />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
