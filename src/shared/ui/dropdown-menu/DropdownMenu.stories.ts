import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { IconLogout } from '@tabler/icons-vue';
import { ref } from 'vue';

import { Button } from '#/shared/ui/button';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '.';

type Props = { open?: boolean; defaultOpen?: boolean; modal?: boolean };

const parts = {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  IconLogout,
};

const content = `<DropdownMenuContent class="min-w-56">
  <DropdownMenuGroup>
    <DropdownMenuLabel>Account</DropdownMenuLabel>
    <DropdownMenuItem>Profile<DropdownMenuShortcut>P</DropdownMenuShortcut></DropdownMenuItem>
    <DropdownMenuItem disabled>Billing</DropdownMenuItem>
    <DropdownMenuCheckboxItem v-model="archived">Show archived</DropdownMenuCheckboxItem>
  </DropdownMenuGroup>
  <DropdownMenuSeparator />
  <DropdownMenuRadioGroup v-model="theme">
    <DropdownMenuLabel>Theme</DropdownMenuLabel>
    <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
    <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
  </DropdownMenuRadioGroup>
  <DropdownMenuSeparator />
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
    <DropdownMenuSubContent><DropdownMenuItem>Export</DropdownMenuItem></DropdownMenuSubContent>
  </DropdownMenuSub>
  <DropdownMenuItem variant="destructive"><IconLogout />Log out</DropdownMenuItem>
</DropdownMenuContent>`;

const meta = {
  component: DropdownMenu,
  tags: ['autodocs'],
  render: (args) => ({
    components: parts,
    setup: () => ({ args, archived: ref(true), theme: ref('light') }),
    template: `<DropdownMenu v-bind="args">
      <DropdownMenuTrigger as-child><Button variant="outline">Open menu</Button></DropdownMenuTrigger>
      ${content}
    </DropdownMenu>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// An open menu would cover the docs page, so autodocs skips this story.
export const Open: Story = {
  tags: ['!autodocs'],
  args: { defaultOpen: true, modal: false },
};
