import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AddButton from './AddButton.vue';

type Props = { label: string };

const meta = {
  component: AddButton,
  tags: ['autodocs'],
  args: { label: 'Add roll' },
  argTypes: { label: { control: 'text' } },
  render: (args) => ({
    components: { AddButton },
    setup: () => ({ args }),
    template: `<AddButton>{{ args.label }}</AddButton>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongLabel: Story = { args: { label: 'Add lab order' } };
