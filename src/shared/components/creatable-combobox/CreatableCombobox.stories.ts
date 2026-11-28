import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, ref, watch } from 'vue';

import type { ComboOption } from './combobox';
import CreatableCombobox from './CreatableCombobox.vue';

type Props = {
  modelValue?: string;
  options: readonly ComboOption[];
  placeholder?: string;
  disabled?: boolean;
  noun?: string;
  invalid?: boolean;
};

const meta = {
  component: CreatableCombobox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    modelValue: '',
    noun: 'mount',
    placeholder: 'Choose or type a mount',
    options: [
      { value: 'Nikon F', count: 3 },
      { value: 'Pentax K', count: 2 },
      { value: 'Leica M', count: 1 },
    ],
  },
  argTypes: { modelValue: { control: 'text' } },
  render: (args) => ({
    components: { CreatableCombobox },
    setup: () => {
      const value = ref(args.modelValue ?? '');
      // follow the Controls panel too, not only typing
      watch(
        () => args.modelValue,
        (next) => (value.value = next ?? ''),
      );
      // a created value joins the list here only; nothing is saved
      const options = computed(() =>
        value.value && !args.options.some((option) => option.value === value.value)
          ? [...args.options, { value: value.value }]
          : args.options,
      );
      return { args, value, options };
    },
    template: `<div class="w-72">
      <CreatableCombobox v-bind="args" :options="options" v-model="value" input-id="mount" />
    </div>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Selected: Story = { args: { modelValue: 'Nikon F' } };
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true, modelValue: 'Pentax K' } };
