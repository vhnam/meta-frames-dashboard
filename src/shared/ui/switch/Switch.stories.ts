import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import { Switch } from '.';

type Props = {
  modelValue?: boolean;
  disabled?: boolean;
  'aria-invalid'?: boolean;
};

const meta = {
  component: Switch,
  tags: ['autodocs'],
  args: { modelValue: false },
  render: (args) => ({
    components: { Switch },
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
      <Switch v-bind="args" :model-value="checked" @update:model-value="checked = $event" />
      Notify when a scan arrives
    </label>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { modelValue: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledOn: Story = { args: { disabled: true, modelValue: true } };
export const Invalid: Story = { args: { 'aria-invalid': true } };
