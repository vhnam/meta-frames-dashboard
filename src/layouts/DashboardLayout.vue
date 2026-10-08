<script setup lang="ts">
import { Outlet } from "@tanstack/vue-router";
import { SidebarInset, SidebarProvider } from "#/shared/ui/sidebar";
import AppSidebar from "./AppSidebar.vue";
import AppHeader from "./AppHeader.vue";
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <main class="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Outlet />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
