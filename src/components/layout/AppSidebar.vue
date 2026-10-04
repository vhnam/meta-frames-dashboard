<script setup lang="ts">
import { IconFrame } from "@tabler/icons-vue";
import { Link, useRouterState } from "@tanstack/vue-router";
import { computed } from "vue";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "#/components/ui/sidebar";
import { navSections } from "./nav";

const pathname = useRouterState({ select: (s) => s.location.pathname });
const isActive = computed(
  () => (to: string) =>
    to === "/"
      ? pathname.value === "/"
      : pathname.value === to || pathname.value.startsWith(to + "/"),
);
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <Link to="/">
              <div
                class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                <IconFrame class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">Meta Frames</span>
                <span class="truncate text-xs">Film Tracker</span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="section in navSections" :key="section.label">
        <SidebarGroupLabel>{{ section.label }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in section.items" :key="item.title">
              <SidebarMenuButton
                :tooltip="item.title"
                :is-active="item.children ? false : isActive(item.to)"
                as-child
              >
                <Link v-if="!item.children" :to="item.to as '/'">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </Link>
                <span v-else class="cursor-default">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </span>
              </SidebarMenuButton>
              <SidebarMenuSub v-if="item.children">
                <SidebarMenuSubItem v-for="child in item.children" :key="child.title">
                  <SidebarMenuSubButton :is-active="isActive(child.to)" as-child>
                    <Link :to="child.to as '/'">
                      <component :is="child.icon" />
                      <span>{{ child.title }}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>
