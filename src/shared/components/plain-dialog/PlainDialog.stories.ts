import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import { Button } from '#/shared/ui/button';
import { Input } from '#/shared/ui/input';

import PlainDialog from './PlainDialog.vue';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  submitLabel?: string;
  wide?: boolean;
};

const meta = {
  component: PlainDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { open: false, title: 'Add lab', description: 'Photo labs you send film to.' },
  argTypes: {
    description: { control: 'text' },
    submitLabel: { control: 'text' },
    wide: { control: 'boolean' },
  },
  render: (args) => ({
    components: { PlainDialog, Button, Input },
    setup: () => {
      const open = ref(args.open);
      // follow the Controls panel too, not only clicks
      watch(
        () => args.open,
        (value) => (open.value = value),
      );
      return { args, open };
    },
    template: `<div>
      <Button variant="outline" @click="open = true">Open dialog</Button>
      <PlainDialog v-bind="args" v-model:open="open" @submit="open = false">
        <Input aria-label="Lab name" placeholder="Lab name" />
      </PlainDialog>
    </div>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Trigger: Story = {};

// An open dialog would cover the docs page, so autodocs skips these stories.
export const Open: Story = { tags: ['!autodocs'], args: { open: true } };
export const OpenWide: Story = {
  tags: ['!autodocs'],
  args: { open: true, wide: true, title: 'Add camera', submitLabel: 'Add camera' },
};
export const OpenNoDescription: Story = {
  tags: ['!autodocs'],
  args: { open: true, description: undefined },
};
