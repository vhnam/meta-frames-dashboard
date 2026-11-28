import { useForm } from '@formisch/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import * as v from 'valibot';

import { required } from '#/shared/lib/schema';

import type { ComboOption } from '../creatable-combobox/combobox';
import FormCombobox from './FormCombobox.vue';

type Props = {
  label: string;
  options: readonly ComboOption[];
  noun?: string;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
};

const MountSchema = v.object({ mount: required('Mount is required.') });

const renderWith =
  (initialInput: { mount: string }, invalid = false) =>
  (args: Props) => ({
    components: { FormCombobox },
    setup: () => {
      const form = useForm({
        schema: MountSchema,
        initialInput,
        validate: invalid ? 'initial' : 'submit',
      });
      return { args, form };
    },
    template: `<div class="w-80"><FormCombobox v-bind="args" :of="form" :path="['mount']" /></div>`,
  });

const meta = {
  component: FormCombobox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    label: 'Mount',
    noun: 'mount',
    placeholder: 'Choose or type a mount',
    required: true,
    options: [
      { value: 'Nikon F', count: 3 },
      { value: 'Pentax K', count: 2 },
      { value: 'Leica M', count: 1 },
    ],
  },
  render: renderWith({ mount: '' }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = { render: renderWith({ mount: 'Nikon F' }) };
export const Optional: Story = { args: { required: false, optional: true } };
export const Invalid: Story = { render: renderWith({ mount: '' }, true) };
export const Disabled: Story = {
  args: { disabled: true },
  render: renderWith({ mount: 'Pentax K' }),
};
