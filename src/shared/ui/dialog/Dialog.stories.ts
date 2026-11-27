import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Button } from '#/shared/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '.';

type Props = { open?: boolean; defaultOpen?: boolean };

const parts = {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};

const body = `<DialogContent>
  <DialogHeader>
    <DialogTitle>Edit roll</DialogTitle>
    <DialogDescription>Change the details of this roll.</DialogDescription>
  </DialogHeader>
  <DialogFooter>
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </DialogFooter>
</DialogContent>`;

const meta = {
  component: Dialog,
  tags: ['autodocs'],
  render: (args) => ({
    components: parts,
    setup: () => ({ args }),
    template: `<Dialog v-bind="args">
      <DialogTrigger as-child><Button variant="outline">Edit roll</Button></DialogTrigger>
      ${body}
    </Dialog>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// An open modal would cover the docs page, so autodocs skips this story.
export const Open: Story = {
  tags: ['!autodocs'],
  args: { defaultOpen: true },
  render: (args) => ({
    components: parts,
    setup: () => ({ args }),
    template: `<Dialog v-bind="args">${body}</Dialog>`,
  }),
};

export const WithoutCloseButton: Story = {
  tags: ['!autodocs'],
  args: { defaultOpen: true },
  render: (args) => ({
    components: parts,
    setup: () => ({ args }),
    template: `<Dialog v-bind="args">${body.replace('<DialogContent>', '<DialogContent :show-close-button="false">')}</Dialog>`,
  }),
};
