import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { toast } from 'vue-sonner';

import { Button } from '#/shared/ui/button';

import { Toaster } from '.';

type Props = {
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  richColors?: boolean;
  closeButton?: boolean;
  expand?: boolean;
};

const meta = {
  component: Toaster,
  // Every example mounts a Toaster and each one gets every toast, so a docs page would show duplicates.
  tags: ['!autodocs'],
  args: { position: 'bottom-right' },
  render: (args) => ({
    components: { Button, Toaster },
    setup: () => ({
      args,
      toast,
      failLoad: () => toast.error('Could not save roll', { description: 'Try again in a moment.' }),
    }),
    template: `<div class="flex gap-2">
      <Toaster v-bind="args" />
      <Button variant="outline" @click="toast('Roll saved')">Default</Button>
      <Button variant="outline" @click="toast.success('Roll saved')">Success</Button>
      <Button variant="outline" @click="failLoad">Error</Button>
    </div>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const RichColors: Story = { args: { richColors: true, closeButton: true } };
