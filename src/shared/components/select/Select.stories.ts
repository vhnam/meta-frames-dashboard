import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import Select from './Select.vue';

type Props = {
  modelValue?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  'aria-invalid'?: boolean;
};

const meta = {
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    modelValue: '',
    placeholder: 'Pick a film format',
    options: [
      { value: '35mm', label: '35mm' },
      { value: '120', label: '120 medium format' },
      { value: '4x5', label: '4x5 sheet' },
    ],
  },
  argTypes: { modelValue: { control: 'text' } },
  render: (args) => ({
    components: { Select },
    setup: () => {
      const value = ref(args.modelValue);
      // follow the Controls panel too, not only clicks
      watch(
        () => args.modelValue,
        (next) => (value.value = next),
      );
      return { args, value };
    },
    template: `<div class="w-64">
      <Select v-bind="args" v-model="value" aria-label="Film format" />
    </div>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Selected: Story = { args: { modelValue: '120' } };
export const WithoutEmptyChoice: Story = { args: { allowEmpty: false } };
export const Invalid: Story = { args: { 'aria-invalid': true } };
export const Disabled: Story = { args: { disabled: true, modelValue: '35mm' } };
