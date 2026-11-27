import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '.';

type Props = {
  modelValue?: string;
  orientation?: 'horizontal' | 'vertical';
  activationMode?: 'automatic' | 'manual';
};

const meta = {
  component: Tabs,
  tags: ['autodocs'],
  args: { modelValue: 'details' },
  render: (args) => ({
    components: { Tabs, TabsContent, TabsList, TabsTrigger },
    setup: () => {
      const active = ref(args.modelValue);
      // follow the Controls panel too, not only clicks
      watch(
        () => args.modelValue,
        (value) => (active.value = value),
      );
      return { args, active };
    },
    template: `<Tabs v-bind="args" :model-value="active" class="w-96" @update:model-value="active = String($event)">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="frames">Frames</TabsTrigger>
        <TabsTrigger value="history" disabled>History</TabsTrigger>
      </TabsList>
      <TabsContent value="details" class="text-sm">Portra 400, 35mm, 36 frames.</TabsContent>
      <TabsContent value="frames" class="text-sm">24 of 36 frames shot.</TabsContent>
      <TabsContent value="history" class="text-sm">No history.</TabsContent>
    </Tabs>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SecondTab: Story = { args: { modelValue: 'frames' } };
