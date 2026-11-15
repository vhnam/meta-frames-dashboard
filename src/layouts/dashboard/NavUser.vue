<script setup lang="ts">
import { IconLogout, IconSelector } from '@tabler/icons-vue';
import { computed } from 'vue';

import { useCurrentUser, useLogout } from '#/features/auth';
import { Avatar, AvatarFallback, AvatarImage } from '#/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/shared/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '#/shared/ui/sidebar';

const me = useCurrentUser();
const logout = useLogout();
const { isMobile } = useSidebar();

const displayName = computed(() => me.data.value?.name || me.data.value?.email || '');
const initials = computed(() =>
  displayName.value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join(''),
);
</script>

<template>
  <SidebarMenu v-if="me.data.value">
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="h-14 border bg-card shadow-xs group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="size-9 rounded-md group-data-[collapsible=icon]:size-8">
              <!-- the initials show while the picture loads, and stay if it fails -->
              <AvatarImage
                v-if="me.data.value.avatarUrl"
                :src="me.data.value.avatarUrl"
                alt=""
                referrer-policy="no-referrer"
                class="rounded-md object-cover"
              />
              <AvatarFallback class="rounded-md bg-secondary text-xs font-semibold">
                {{ initials }}
              </AvatarFallback>
            </Avatar>
            <div
              class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
            >
              <span class="truncate font-heading font-medium">{{ displayName }}</span>
              <span class="truncate text-xs text-muted-foreground">{{ me.data.value.email }}</span>
            </div>
            <IconSelector
              class="ml-auto size-4 group-data-[collapsible=icon]:hidden"
              aria-hidden="true"
            />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="font-normal">
            <div class="grid text-sm leading-tight">
              <span class="truncate font-medium">{{ displayName }}</span>
              <span class="truncate text-xs text-muted-foreground">{{ me.data.value.email }}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            :disabled="logout.isPending.value"
            @select="logout.mutate()"
          >
            <IconLogout />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
