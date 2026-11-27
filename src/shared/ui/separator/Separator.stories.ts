import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Separator } from '.';

type Props = { orientation?: 'horizontal' | 'vertical'; decorative?: boolean };

const meta = {
  component: Separator,
  tags: ['autodocs'],
  render: (args) => ({
    components: { Separator },
    setup: () => ({ args }),
    template: `<div :class="args.orientation === 'vertical' ? 'flex h-6 items-center gap-3 text-sm' : 'w-64 text-sm'">
      <span>Rolls</span>
      <Separator v-bind="args" :class="args.orientation === 'vertical' ? '' : 'my-2'" />
      <span>Cameras</span>
    </div>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};
export const Vertical: Story = { args: { orientation: 'vertical' } };
