import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Button } from '#/shared/ui/button';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '.';

type Props = { defaultOpen?: boolean; open?: boolean; disabled?: boolean };

const meta = {
  component: Collapsible,
  tags: ['autodocs'],
  render: (args) => ({
    components: { Button, Collapsible, CollapsibleContent, CollapsibleTrigger },
    setup: () => ({ args }),
    template: `<Collapsible v-bind="args" class="grid max-w-sm gap-2">
      <CollapsibleTrigger as-child><Button variant="outline">Toggle details</Button></CollapsibleTrigger>
      <CollapsibleContent class="text-sm">Exposed at box speed, pushed one stop.</CollapsibleContent>
    </Collapsible>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const Open: Story = { args: { defaultOpen: true } };
export const Disabled: Story = { args: { disabled: true } };
