import { useForm } from '@formisch/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import * as v from 'valibot';
import type { ConcreteComponent } from 'vue';

import { required } from '#/shared/lib/schema';

import FormSelect from './FormSelect.vue';

type Props = {
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  searchable?: boolean;
};

const FormatSchema = v.object({ format: required('Film format is required.') });

const renderWith =
  (initialInput: { format: string }, invalid = false) =>
  (args: Props) => ({
    components: { FormSelect },
    setup: () => {
      const form = useForm({
        schema: FormatSchema,
        initialInput,
        validate: invalid ? 'initial' : 'submit',
      });
      return { args, form };
    },
    template: `<div class="w-80"><FormSelect v-bind="args" :of="form" :path="['format']" /></div>`,
  });

const meta = {
  // Generic SFC: Storybook cannot infer its props, so type it with the story args.
  component: FormSelect as unknown as ConcreteComponent<Props>,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    label: 'Film format',
    placeholder: 'Pick a film format',
    required: true,
    options: [
      { value: '35mm', label: '35mm' },
      { value: '120', label: '120 medium format' },
      { value: '4x5', label: '4x5 sheet' },
    ],
  },
  render: renderWith({ format: '' }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = { render: renderWith({ format: '120' }) };
export const Optional: Story = { args: { required: false, optional: true } };
export const Searchable: Story = { args: { searchable: true } };
export const Invalid: Story = { render: renderWith({ format: '' }, true) };
export const InvalidSearchable: Story = {
  args: { searchable: true },
  render: renderWith({ format: '' }, true),
};
export const Disabled: Story = { args: { disabled: true }, render: renderWith({ format: '35mm' }) };
