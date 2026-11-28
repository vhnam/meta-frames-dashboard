import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Input } from '.';

type Props = {
  modelValue?: string | number;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
};

const meta = {
  component: Input,
  tags: ['autodocs'],
  args: { placeholder: 'Camera model' },
  render: (args) => ({
    components: { Input },
    setup: () => ({ args }),
    template: '<Input v-bind="args" aria-label="Camera model" class="max-w-sm" />',
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = { args: { modelValue: 'Nikon FM2' } };
export const Disabled: Story = { args: { modelValue: 'Nikon FM2', disabled: true } };
export const Invalid: Story = { args: { modelValue: 'Nikon FM2', 'aria-invalid': true } };
export const Number: Story = { args: { type: 'number', modelValue: 400, placeholder: 'ISO' } };
