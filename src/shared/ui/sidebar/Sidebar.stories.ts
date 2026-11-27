import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { IconCamera, IconHome, IconMovie } from '@tabler/icons-vue';
import { ref, watch } from 'vue';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '.';

type Props = {
  open?: boolean;
  collapsible?: 'offcanvas' | 'icon' | 'none';
  variant?: 'sidebar' | 'floating' | 'inset';
  side?: 'left' | 'right';
};

const parts = {
  IconCamera,
  IconHome,
  IconMovie,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
};

const meta = {
  component: Sidebar,
  // The sidebar is fixed to the viewport, so it cannot sit inside a docs page.
  parameters: { layout: 'fullscreen' },
  args: { open: true, collapsible: 'icon', variant: 'sidebar', side: 'left' },
  render: (args) => ({
    components: parts,
    setup: () => {
      const open = ref(args.open);
      // follow the Controls panel too, not only the trigger
      watch(
        () => args.open,
        (value) => (open.value = value),
      );
      return { args, open };
    },
    template: `<SidebarProvider :open="open" @update:open="open = $event">
      <Sidebar :collapsible="args.collapsible" :variant="args.variant" :side="args.side">
        <SidebarHeader class="px-3 font-semibold">Meta Frames</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Library</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Home" is-active><IconHome /><span>Home</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Rolls"><IconMovie /><span>Rolls</span></SidebarMenuButton>
                  <SidebarMenuBadge>12</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Cameras" disabled><IconCamera /><span>Cameras</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuSkeleton show-icon /></SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter class="px-3 text-xs">v1.0</SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header class="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span class="text-sm">Dashboard</span>
        </header>
      </SidebarInset>
    </SidebarProvider>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {};
export const Collapsed: Story = { args: { open: false } };
export const Floating: Story = { args: { variant: 'floating' } };
export const Offcanvas: Story = { args: { collapsible: 'offcanvas' } };
