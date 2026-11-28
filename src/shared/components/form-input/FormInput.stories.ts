import { useForm } from '@formisch/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import * as v from 'valibot';
import type { ConcreteComponent } from 'vue';

import { required } from '#/shared/lib/schema';

import FormInput from './FormInput.vue';

type Props = {
  label: string;
  hint?: string;
  optional?: boolean;
  required?: boolean;
  suffix?: string;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

const CameraSchema = v.object({ model: required('Camera model is required.') });

// Each story builds its own store; `invalid` runs the real schema on the empty value.
const renderWith =
  (initialInput: { model: string }, invalid = false) =>
  (args: Props) => ({
    components: { FormInput },
    setup: () => {
      const form = useForm({
        schema: CameraSchema,
        initialInput,
        validate: invalid ? 'initial' : 'submit',
      });
      return { args, form };
    },
    template: `<div class="w-80"><FormInput v-bind="args" :of="form" :path="['model']" /></div>`,
  });

const meta = {
  // Generic SFC: Storybook cannot infer its props, so type it with the story args.
  component: FormInput as unknown as ConcreteComponent<Props>,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { label: 'Camera model', placeholder: 'e.g. Nikon FM2' },
  render: renderWith({ model: '' }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = { render: renderWith({ model: 'Nikon FM2' }) };
export const Required: Story = { args: { required: true } };
export const Optional: Story = { args: { optional: true } };
export const WithHint: Story = { args: { hint: 'As engraved on the camera body.' } };
export const WithSuffix: Story = {
  args: { label: 'Box speed', suffix: 'ASA/ISO', type: 'number', placeholder: '400' },
};
export const Multiline: Story = { args: { label: 'Notes', multiline: true } };
export const Invalid: Story = { args: { required: true }, render: renderWith({ model: '' }, true) };
export const Disabled: Story = {
  args: { disabled: true },
  render: renderWith({ model: 'Nikon FM2' }),
};
