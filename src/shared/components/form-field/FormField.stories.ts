import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Input } from '#/shared/ui/input';

import FormField from './FormField.vue';

type Props = {
  label: string;
  hint?: string;
  optional?: boolean;
  required?: boolean;
  error?: string;
};

// FormField hands the input id and error id to its slot, so the label and error text stay linked.
const meta = {
  component: FormField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { label: 'Lens' },
  argTypes: { error: { control: 'text' }, hint: { control: 'text' } },
  render: (args) => ({
    components: { FormField, Input },
    setup: () => ({ args }),
    template: `<div class="w-80">
      <FormField v-bind="args" v-slot="{ id, errorId }">
        <Input :id="id" :aria-describedby="errorId" :aria-invalid="!!args.error" placeholder="e.g. 50mm f/1.8" />
      </FormField>
    </div>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Required: Story = { args: { required: true } };
export const Optional: Story = { args: { optional: true } };
export const WithHint: Story = { args: { hint: 'Focal length and maximum aperture.' } };
export const WithError: Story = { args: { error: 'Lens is required.' } };
