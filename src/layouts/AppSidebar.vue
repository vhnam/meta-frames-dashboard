<script setup lang="ts">
import { IconAperture } from "@tabler/icons-vue";
import { Link, useRouterState } from "@tanstack/vue-router";
import { computed } from "vue";
import { useRollList } from "#/features/rolls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "#/shared/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "#/shared/ui/sidebar";
import { navSections } from "./nav";
import NavUser from "./NavUser.vue";

const pathname = useRouterState({ select: (s) => s.location.pathname });
const isActive = computed(
  () => (to: string) => pathname.value === to || pathname.value.startsWith(to + "/"),
);

// the icon rail hides sub-menus, so an item with children opens them in a dropdown instead
const { state, isMobile } = useSidebar();
const collapsed = computed(() => state.value === "collapsed" && !isMobile.value);

// counts shown next to a nav item
const rolls = useRollList({});
const counts = computed<Record<string, number | undefined>>(() => ({
  "/app/rolls": rolls.data.value?.length,
}));

const itemClass =
  "h-10 gap-3 border border-transparent px-3 text-sm [&>svg]:size-5 [&>svg]:text-muted-foreground " +
  "data-[active=true]:border-sidebar-border data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium " +
  "data-[active=true]:shadow-xs data-[active=true]:[&>svg]:text-primary " +
  // collapsed: a 40px square centred on the icon (the default 32px clips a 20px icon)
  "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2.5! group-data-[collapsible=icon]:[&>span]:hidden";
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader class="border-sidebar-border h-14 justify-center border-b px-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            class="hover:bg-transparent group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center"
            as-child
          >
            <Link to="/app">
              <div
                class="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md shadow-sm"
              >
                <IconAperture class="size-[1.125rem]" aria-hidden="true" />
              </div>
              <div class="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span class="font-heading truncate text-[0.95rem] font-semibold">Meta Frames</span>
                <span class="text-muted-foreground truncate text-xs tracking-[0.12em] uppercase">
                  Film tracker
                </span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent class="gap-2 px-1 py-3 group-data-[collapsible=icon]:gap-0">
      <SidebarGroup v-for="section in navSections" :key="section.label">
        <SidebarGroupLabel
          class="text-foreground/80 justify-between text-[0.7rem] font-semibold tracking-[0.14em] uppercase"
        >
          {{ section.label }}
          <span class="bg-border size-1 rounded-full" aria-hidden="true" />
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu class="gap-1">
            <SidebarMenuItem v-for="item in section.items" :key="item.title">
              <DropdownMenu v-if="item.children && collapsed">
                <DropdownMenuTrigger as-child>
                  <SidebarMenuButton
                    :is-active="item.children.some((c) => isActive(c.to))"
                    :class="itemClass"
                    :aria-label="item.title"
                  >
                    <component :is="item.icon" />
                    <span>{{ item.title }}</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" :side-offset="8" class="min-w-40">
                  <DropdownMenuLabel>{{ item.title }}</DropdownMenuLabel>
                  <DropdownMenuItem v-for="child in item.children" :key="child.title" as-child>
                    <Link
                      :to="child.to as '/'"
                      :class="isActive(child.to) ? 'text-primary font-medium' : undefined"
                    >
                      <component :is="child.icon" />
                      {{ child.title }}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <SidebarMenuButton
                v-else
                :tooltip="item.title"
                :is-active="item.children ? false : isActive(item.to)"
                :class="itemClass"
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
              <SidebarMenuBadge
                v-if="counts[item.to] != null && !item.children"
                class="bg-card top-1/2! right-2.5 -translate-y-1/2 border tabular-nums"
              >
                {{ counts[item.to] }}
              </SidebarMenuBadge>
              <SidebarMenuSub v-if="item.children" class="ml-5 gap-0.5 py-1">
                <SidebarMenuSubItem v-for="child in item.children" :key="child.title">
                  <SidebarMenuSubButton
                    :is-active="isActive(child.to)"
                    class="data-[active=true]:text-primary h-9 gap-3 text-sm data-[active=true]:font-medium"
                    as-child
                  >
                    <Link :to="child.to as '/'">
                      <span
                        class="size-1.5 shrink-0 rounded-full bg-current opacity-30"
                        aria-hidden="true"
                      />
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
    <SidebarFooter class="border-sidebar-border border-t p-3">
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
