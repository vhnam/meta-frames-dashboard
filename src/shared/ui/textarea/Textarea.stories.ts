import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import { Textarea } from '.';

type Props = {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
};

const meta = {
  component: Textarea,
  tags: ['autodocs'],
  args: { modelValue: '', placeholder: 'Notes about this roll' },
  render: (args) => ({
    components: { Textarea },
    setup: () => {
      const text = ref(args.modelValue);
      // follow the Controls panel too, not only typing
      watch(
        () => args.modelValue,
        (value) => (text.value = value),
      );
      return { args, text };
    },
    template: `<Textarea v-bind="args" v-model="text" aria-label="Notes" class="w-80" />`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = { args: { modelValue: 'Pushed one stop. Shot in low light.' } };
export const Disabled: Story = { args: { disabled: true, modelValue: 'Locked while developing.' } };
export const Invalid: Story = { args: { 'aria-invalid': true, modelValue: 'x' } };
