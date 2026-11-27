import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Button } from '#/shared/ui/button';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '.';

type Props = { open?: boolean; defaultOpen?: boolean; disabled?: boolean };

const meta = {
  component: Tooltip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  render: (args) => ({
    components: { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger },
    setup: () => ({ args }),
    // Tooltip needs a provider; the component does not add one.
    template: `<TooltipProvider>
      <Tooltip v-bind="args">
        <TooltipTrigger as-child><Button variant="outline">Hover me</Button></TooltipTrigger>
        <TooltipContent>Add to stock</TooltipContent>
      </Tooltip>
    </TooltipProvider>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };

// An always-open tooltip would overlap the docs page, so autodocs skips this story.
export const Open: Story = {
  tags: ['!autodocs'],
  args: { defaultOpen: true },
};
