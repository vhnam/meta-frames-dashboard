import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { IconTrash } from '@tabler/icons-vue';

import { Button } from '#/shared/ui/button';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '.';

type Props = { open?: boolean; defaultOpen?: boolean };

const parts = {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  IconTrash,
};

const body = `<AlertDialogContent>
  <AlertDialogHeader>
    <AlertDialogMedia class="bg-destructive/10 text-destructive"><IconTrash aria-hidden="true" /></AlertDialogMedia>
    <AlertDialogTitle>Delete this roll?</AlertDialogTitle>
    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
  </AlertDialogHeader>
  <AlertDialogFooter>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <Button variant="destructive">Delete</Button>
  </AlertDialogFooter>
</AlertDialogContent>`;

const meta = {
  component: AlertDialog,
  tags: ['autodocs'],
  render: (args) => ({
    components: parts,
    setup: () => ({ args }),
    template: `<AlertDialog v-bind="args">
      <AlertDialogTrigger as-child><Button variant="outline">Delete roll</Button></AlertDialogTrigger>
      ${body}
    </AlertDialog>`,
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
    template: `<AlertDialog v-bind="args">${body}</AlertDialog>`,
  }),
};
