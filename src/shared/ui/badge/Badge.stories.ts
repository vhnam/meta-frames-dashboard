import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { BadgeVariants } from '.';
import { Badge } from '.';

const meta = {
  component: Badge,
  tags: ['autodocs'],
  args: { variant: 'default' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'secondary', 'destructive', 'outline'] },
  },
  render: (args) => ({
    components: { Badge },
    setup: () => ({ args }),
    template: '<Badge v-bind="args">Badge</Badge>',
  }),
} satisfies Meta<BadgeVariants & { 'aria-invalid'?: boolean }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Destructive: Story = { args: { variant: 'destructive' } };
export const Outline: Story = { args: { variant: 'outline' } };
export const Invalid: Story = { args: { variant: 'outline', 'aria-invalid': true } };
