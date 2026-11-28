import { useForm } from '@formisch/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import * as v from 'valibot';
import { ref } from 'vue';
import type { ConcreteComponent } from 'vue';

import { required } from '#/shared/lib/schema';
import { Button } from '#/shared/ui/button';

import FormInput from '../form-input/FormInput.vue';
import FormSection from '../form-section/FormSection.vue';
import SectionedFormDialog from './SectionedFormDialog.vue';

type Props = {
  title: string;
  description: string;
  submitLabel?: string;
  pending?: boolean;
  readOnly?: boolean;
  size?: 'md' | 'lg';
};

const LabSchema = v.object({ name: required('Lab name is required.'), address: v.string() });

// Submit does nothing here: the dialog just closes.
const renderWith = (options: { startOpen: boolean; invalid?: boolean }) => (args: Props) => ({
  components: { SectionedFormDialog, FormSection, FormInput, Button },
  setup: () => {
    const form = useForm({
      schema: LabSchema,
      validate: options.invalid ? 'initial' : 'submit',
      initialInput: options.invalid
        ? { name: '', address: '' }
        : { name: 'Saigon Film Lab', address: '' },
    });
    const open = ref(options.startOpen);
    return { args, form, open };
  },
  template: `<div>
    <Button v-if="!${options.startOpen}" @click="open = true">Add lab</Button>
    <SectionedFormDialog v-bind="args" v-model:open="open" :form="form" @submit="open = false">
      <FormSection no="01" title="Lab" note="* Required attributes">
        <div class="grid gap-y-6">
          <FormInput :of="form" :path="['name']" label="Name" required placeholder="e.g. Saigon Film Lab" />
          <FormInput :of="form" :path="['address']" label="Address" optional placeholder="e.g. 12 Nguyen Hue, District 1" />
        </div>
      </FormSection>
    </SectionedFormDialog>
  </div>`,
});

// Every story opens the one shared dialog overlay, so a docs page would mount several: autodocs is off.
const meta = {
  // Generic SFC: Storybook cannot infer its props, so type it with the story args.
  component: SectionedFormDialog as unknown as ConcreteComponent<Props>,
  tags: ['!autodocs'],
  parameters: { layout: 'centered' },
  args: {
    title: 'Add Lab',
    description: 'Register a lab you send film to for developing and scanning',
    submitLabel: 'Add lab',
    size: 'md',
  },
  render: renderWith({ startOpen: false }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Trigger: Story = {};
export const Open: Story = { render: renderWith({ startOpen: true }) };
export const Pending: Story = { args: { pending: true }, render: renderWith({ startOpen: true }) };
export const ReadOnly: Story = {
  args: { readOnly: true },
  render: renderWith({ startOpen: true }),
};
export const Invalid: Story = {
  render: renderWith({ startOpen: true, invalid: true }),
};
