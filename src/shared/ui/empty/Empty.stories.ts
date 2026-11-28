import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { IconMapOff } from '@tabler/icons-vue';

import { Button } from '#/shared/ui/button';

import type { EmptyMediaVariants } from '.';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '.';

const meta = {
  component: EmptyMedia,
  tags: ['autodocs'],
  args: { variant: 'icon' },
  argTypes: { variant: { control: 'select', options: ['default', 'icon'] } },
  render: (args) => ({
    components: {
      Button,
      Empty,
      EmptyContent,
      EmptyDescription,
      EmptyHeader,
      EmptyMedia,
      EmptyTitle,
      IconMapOff,
    },
    setup: () => ({ args }),
    template: `<Empty>
      <EmptyHeader>
        <EmptyMedia v-bind="args"><IconMapOff aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>No rolls yet</EmptyTitle>
        <EmptyDescription>Add your first roll to start tracking.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent><Button>Add roll</Button></EmptyContent>
    </Empty>`,
  }),
} satisfies Meta<EmptyMediaVariants>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IconMedia: Story = {};
export const PlainMedia: Story = { args: { variant: 'default' } };

export const TextOnly: Story = {
  render: () => ({
    components: { Empty, EmptyDescription, EmptyHeader, EmptyTitle },
    template: `<Empty>
      <EmptyHeader>
        <EmptyTitle>Nothing here</EmptyTitle>
        <EmptyDescription>No results match the filter.</EmptyDescription>
      </EmptyHeader>
    </Empty>`,
  }),
};
