import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-vue';

import { Button } from '#/shared/ui/button';

import type { AlertVariants } from '.';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '.';

const meta = {
  component: Alert,
  tags: ['autodocs'],
  args: { variant: 'default' },
  argTypes: { variant: { control: 'select', options: ['default', 'destructive'] } },
  render: (args) => ({
    components: { Alert, AlertDescription, AlertTitle, IconInfoCircle },
    setup: () => ({ args }),
    template: `<Alert v-bind="args">
      <IconInfoCircle aria-hidden="true" />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>This roll is still marked as loaded.</AlertDescription>
    </Alert>`,
  }),
} satisfies Meta<AlertVariants>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Destructive: Story = {
  args: { variant: 'destructive' },
  render: (args) => ({
    components: { Alert, AlertDescription, AlertTitle, IconAlertCircle },
    setup: () => ({ args }),
    template: `<Alert v-bind="args">
      <IconAlertCircle aria-hidden="true" />
      <AlertTitle>Could not save</AlertTitle>
      <AlertDescription>Check the form and try again.</AlertDescription>
    </Alert>`,
  }),
};

export const WithAction: Story = {
  render: (args) => ({
    components: { Alert, AlertAction, AlertDescription, AlertTitle, Button },
    setup: () => ({ args }),
    template: `<Alert v-bind="args">
      <AlertTitle>Scans ready</AlertTitle>
      <AlertDescription>Twelve scans were imported.</AlertDescription>
      <AlertAction><Button size="xs" variant="outline">View</Button></AlertAction>
    </Alert>`,
  }),
};
