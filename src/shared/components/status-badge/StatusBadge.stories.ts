import type { Meta, StoryObj } from '@storybook/vue3-vite';

import StatusBadge from './StatusBadge.vue';

type Tone = 'neutral' | 'warning' | 'success' | 'info' | 'danger';
type Props = { tone?: Tone };

const meta = {
  component: StatusBadge,
  tags: ['autodocs'],
  args: { tone: 'neutral' },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'warning', 'success', 'info', 'danger'] },
  },
  render: (args) => ({
    components: { StatusBadge },
    setup: () => ({ args }),
    template: `<StatusBadge v-bind="args">Developed</StatusBadge>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { tone: 'neutral' } };
export const Warning: Story = { args: { tone: 'warning' } };
export const Success: Story = { args: { tone: 'success' } };
export const Info: Story = { args: { tone: 'info' } };
export const Danger: Story = { args: { tone: 'danger' } };
export const NoTone: Story = { args: { tone: undefined } };
