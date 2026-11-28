import type { Meta, StoryObj } from '@storybook/vue3-vite';

import EmptyState from './EmptyState.vue';

type Props = { text: string };

const meta = {
  component: EmptyState,
  tags: ['autodocs'],
  args: { text: 'No rolls yet.' },
  render: (args) => ({
    components: { EmptyState },
    setup: () => ({ args }),
    template: `<EmptyState v-bind="args" />`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filtered: Story = { args: { text: 'No rolls match this stock.' } };
