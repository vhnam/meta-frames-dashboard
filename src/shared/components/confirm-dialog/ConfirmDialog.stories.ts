import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { onBeforeUnmount, onMounted } from 'vue';

import { ask, pendingAsk } from '#/shared/lib/ui';
import { Button } from '#/shared/ui/button';

import ConfirmDialog from './ConfirmDialog.vue';

type Props = { message: string };

// ConfirmDialog reads the `pendingAsk` singleton, so a story drives it through `ask()`.
// Clear the singleton on unmount so the next story does not start with an open dialog.
const meta = {
  component: ConfirmDialog,
  // Both docs examples would mount a dialog on the one `pendingAsk` singleton, so autodocs is off.
  tags: ['!autodocs'],
  parameters: { layout: 'centered' },
  args: { message: 'Delete roll "Portra 400, 12 Mar"?' },
  argTypes: { message: { control: 'text' } },
  render: (args) => ({
    components: { ConfirmDialog, Button },
    setup: () => {
      onBeforeUnmount(() => (pendingAsk.value = undefined));
      return { args, ask };
    },
    template: `<div>
      <Button variant="destructive" @click="ask(args.message)">Delete roll</Button>
      <ConfirmDialog />
    </div>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Trigger: Story = {};

export const Open: Story = {
  render: (args) => ({
    components: { ConfirmDialog },
    setup: () => {
      onMounted(() => void ask(args.message));
      onBeforeUnmount(() => (pendingAsk.value = undefined));
    },
    template: `<ConfirmDialog />`,
  }),
};
