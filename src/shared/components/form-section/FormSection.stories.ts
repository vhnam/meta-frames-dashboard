import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Input } from '#/shared/ui/input';
import { Label } from '#/shared/ui/label';

import FormSection from './FormSection.vue';

type Props = { no: string; title: string; note?: string };

const meta = {
  component: FormSection,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { no: '01', title: 'Camera', note: '* Required attributes' },
  render: (args) => ({
    components: { FormSection, Input, Label },
    setup: () => ({ args }),
    template: `<FormSection v-bind="args">
      <div class="grid gap-1.5">
        <Label for="section-brand">Brand</Label>
        <Input id="section-brand" model-value="Nikon" />
      </div>
    </FormSection>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutNote: Story = { args: { note: undefined } };
