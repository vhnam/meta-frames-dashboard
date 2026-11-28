import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Button } from '#/shared/ui/button';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '.';

type Props = { open?: boolean; defaultOpen?: boolean; modal?: boolean };
type Side = 'top' | 'right' | 'bottom' | 'left';

const parts = {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};

const meta = {
  component: Sheet,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  render: (args) => ({
    components: parts,
    setup: () => ({ args }),
    template: `<Sheet v-bind="args">
      <SheetTrigger as-child><Button variant="outline">Open sheet</Button></SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Audit log</SheetTitle>
          <SheetDescription>Recent changes to this roll.</SheetDescription>
        </SheetHeader>
        <p class="px-4 text-sm">Loaded into Nikon F3 on 12 March.</p>
        <SheetFooter>
          <SheetClose as-child><Button variant="outline">Close</Button></SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// An open sheet would cover the docs page, so autodocs skips these stories.
export const Open: Story = {
  tags: ['!autodocs'],
  args: { defaultOpen: true },
};

export const OpenLeft: Story = {
  tags: ['!autodocs'],
  args: { defaultOpen: true },
  render: (args) => ({
    components: parts,
    setup: () => ({ args, side: 'left' as Side }),
    template: `<Sheet v-bind="args">
      <SheetContent :side="side">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow the roll list.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>`,
  }),
};
