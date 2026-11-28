import { getInput, useForm } from '@formisch/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import * as v from 'valibot';
import type { ConcreteComponent } from 'vue';

import { required } from '#/shared/lib/schema';

import FormRichText from './FormRichText.vue';

type Props = {
  label: string;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
};

const NotesSchema = v.object({ description: required('Description is required.') });

// The Markdown the editor writes to the form is printed under the field.
const renderWith =
  (initialInput: { description: string }, invalid = false) =>
  (args: Props) => ({
    components: { FormRichText },
    setup: () => {
      const form = useForm({
        schema: NotesSchema,
        initialInput,
        validate: invalid ? 'initial' : 'submit',
      });
      return { args, form, getInput };
    },
    template: `<div class="grid w-xl max-w-full gap-3">
    <FormRichText v-bind="args" :of="form" :path="['description']" />
    <pre class="rounded-md bg-muted p-3 text-xs whitespace-pre-wrap" aria-label="Markdown form value">{{ getInput(form).description || '(empty)' }}</pre>
  </div>`,
  });

const meta = {
  // Generic SFC: Storybook cannot infer its props, so type it with the story args.
  component: FormRichText as unknown as ConcreteComponent<Props>,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    label: 'Description',
    optional: true,
    placeholder: 'Condition, quirks, light seals, meter accuracy…',
  },
  render: renderWith({ description: '' }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = {
  render: renderWith({
    description: '**Light seals replaced** in 2024.\n\n- Meter reads half a stop high',
  }),
};
export const Required: Story = { args: { optional: false, required: true } };
export const Invalid: Story = {
  args: { optional: false, required: true },
  render: renderWith({ description: '' }, true),
};
export const Disabled: Story = {
  args: { disabled: true },
  render: renderWith({ description: 'Sold with the 50mm f/1.8.' }),
};
