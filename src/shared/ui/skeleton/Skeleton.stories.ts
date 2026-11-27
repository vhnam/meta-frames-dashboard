import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { HTMLAttributes } from 'vue';

import { Skeleton } from '.';

type Props = { class?: HTMLAttributes['class'] };

const meta = {
  component: Skeleton,
  tags: ['autodocs'],
  args: { class: 'h-4 w-64' },
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {};

export const Card: Story = {
  render: () => ({
    components: { Skeleton },
    template: `<div class="flex items-center gap-4">
      <Skeleton class="size-12 rounded-full" />
      <div class="space-y-2">
        <Skeleton class="h-4 w-64" />
        <Skeleton class="h-4 w-40" />
      </div>
    </div>`,
  }),
};
