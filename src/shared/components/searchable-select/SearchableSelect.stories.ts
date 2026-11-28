import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import SearchableSelect from './SearchableSelect.vue';

type Props = {
  modelValue?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
};

const meta = {
  component: SearchableSelect,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    modelValue: '',
    placeholder: 'Search film stocks',
    options: [
      { value: 'portra-400', label: 'Kodak Portra 400' },
      { value: 'hp5', label: 'Ilford HP5 Plus' },
      { value: 'velvia-50', label: 'Fujifilm Velvia 50' },
      { value: 'tri-x', label: 'Kodak Tri-X 400' },
    ],
  },
  argTypes: { modelValue: { control: 'text' } },
  render: (args) => ({
    components: { SearchableSelect },
    setup: () => {
      const value = ref(args.modelValue);
      // follow the Controls panel too, not only picks
      watch(
        () => args.modelValue,
        (next) => (value.value = next),
      );
      return { args, value };
    },
    template: `<div class="w-72">
      <SearchableSelect v-bind="args" v-model="value" input-id="stock" />
    </div>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Selected: Story = { args: { modelValue: 'hp5' } };
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true, modelValue: 'portra-400' } };
