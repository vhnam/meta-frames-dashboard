import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Input } from '#/shared/ui/input';

import { Label } from '.';

const meta = {
  component: Label,
  tags: ['autodocs'],
  render: () => ({
    components: { Input, Label },
    template: `<div class="grid max-w-sm gap-2">
      <Label for="story-label-input">Camera model</Label>
      <Input id="story-label-input" />
    </div>`,
  }),
} satisfies Meta<{ for?: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DisabledControl: Story = {
  render: () => ({
    components: { Input, Label },
    template: `<div class="grid max-w-sm gap-2">
      <Label for="story-label-disabled">Camera model</Label>
      <Input id="story-label-disabled" disabled />
    </div>`,
  }),
};
