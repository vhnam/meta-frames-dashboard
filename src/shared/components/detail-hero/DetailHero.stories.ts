import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Button } from '#/shared/ui/button';

import StatusBadge from '../status-badge/StatusBadge.vue';
import DetailHero from './DetailHero.vue';

type Props = {
  kind: string;
  id: string;
  title: string;
  description?: string;
  numericTitle?: boolean;
  wideStats?: boolean;
};

const meta = {
  component: DetailHero,
  tags: ['autodocs'],
  args: { kind: 'Roll', id: '3f9c2a71-5b0e-4d1a-9c3e-0a1b2c3d4e5f', title: 'Kodak Portra 400' },
  argTypes: {
    description: { control: 'text' },
    numericTitle: { control: 'boolean' },
    wideStats: { control: 'boolean' },
  },
  render: (args) => ({
    components: { DetailHero },
    setup: () => ({ args }),
    template: `<DetailHero v-bind="args" />`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Minimal: Story = {};

export const Full: Story = {
  args: { description: 'Base stock: Kodak Portra 400' },
  render: (args) => ({
    components: { DetailHero, Button, StatusBadge },
    setup: () => ({ args }),
    template: `<DetailHero v-bind="args">
      <template #actions>
        <Button variant="outline">Edit roll</Button>
        <Button>Mark developed</Button>
      </template>
      <template #chips>
        <StatusBadge tone="success">Developed</StatusBadge>
        <StatusBadge tone="info">35mm</StatusBadge>
      </template>
      <p class="text-sm">Shot on a Nikon F3, 36 exposures.</p>
      <template #stats>
        <div><dt>Camera</dt><dd class="text-lg font-semibold">Nikon F3</dd></div>
        <div><dt>Frames</dt><dd class="text-lg font-semibold tabular-nums">36</dd></div>
        <div><dt>Loaded</dt><dd class="text-lg font-semibold">12 Mar 2026</dd></div>
      </template>
    </DetailHero>`,
  }),
};

const orderCode = '1042';

export const WideStats: Story = {
  args: { kind: 'Lab order', title: `#${orderCode}`, numericTitle: true, wideStats: true },
  render: (args) => ({
    components: { DetailHero },
    setup: () => ({ args }),
    template: `<DetailHero v-bind="args">
      <template #stats>
        <div><dt>Lab</dt><dd class="text-lg font-semibold">Harman Lab</dd></div>
        <div><dt>Rolls</dt><dd class="text-lg font-semibold tabular-nums">4</dd></div>
        <div><dt>Sent</dt><dd class="text-lg font-semibold">2 Apr 2026</dd></div>
        <div><dt>Returned</dt><dd class="text-lg font-semibold">9 Apr 2026</dd></div>
      </template>
    </DetailHero>`,
  }),
};
