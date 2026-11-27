import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import { Checkbox } from '.';

type Props = {
  modelValue?: boolean | 'indeterminate';
  disabled?: boolean;
  'aria-invalid'?: boolean;
};

const meta = {
  component: Checkbox,
  tags: ['autodocs'],
  args: { modelValue: false },
  render: (args) => ({
    components: { Checkbox },
    setup: () => {
      const checked = ref(args.modelValue);
      // follow the Controls panel too, not only clicks
      watch(
        () => args.modelValue,
        (value) => (checked.value = value),
      );
      return { args, checked };
    },
    template: `<label class="flex items-center gap-2 text-sm">
      <Checkbox v-bind="args" :model-value="checked" @update:model-value="checked = $event" />
      Scan with dust removal
    </label>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { modelValue: true } };
export const Indeterminate: Story = { args: { modelValue: 'indeterminate' } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = { args: { disabled: true, modelValue: true } };
export const Invalid: Story = { args: { 'aria-invalid': true } };
