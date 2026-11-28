import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Button } from '#/shared/ui/button';

import NotFound from './NotFound.vue';

type Props = { description?: string };

const meta = {
  component: NotFound,
  tags: ['autodocs'],
  argTypes: { description: { control: 'text' } },
  render: (args) => ({
    components: { NotFound },
    setup: () => ({ args }),
    template: `<NotFound v-bind="args" />`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const CustomDescription: Story = {
  args: { description: 'This roll was deleted or never existed.' },
};

export const WithAction: Story = {
  render: (args) => ({
    components: { NotFound, Button },
    setup: () => ({ args }),
    template: `<NotFound v-bind="args"><Button as-child><a href="/">Back to rolls</a></Button></NotFound>`,
  }),
};
