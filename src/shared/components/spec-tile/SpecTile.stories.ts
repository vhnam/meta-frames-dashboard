import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SpecTile from './SpecTile.vue';

type Props = { label: string; sub?: string };

const meta = {
  component: SpecTile,
  tags: ['autodocs'],
  args: { label: 'Box ISO' },
  argTypes: { sub: { control: 'text' } },
  render: (args) => ({
    components: { SpecTile },
    setup: () => ({ args }),
    template: `<SpecTile v-bind="args">400</SpecTile>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithSub: Story = { args: { sub: 'Rated at box speed' } };

export const Grid: Story = {
  render: () => ({
    components: { SpecTile },
    template: `<div class="grid grid-cols-3 gap-3">
      <SpecTile label="Brand">Kodak</SpecTile>
      <SpecTile label="Name">Portra 400</SpecTile>
      <SpecTile label="Process" sub="Develop at 38 C">C-41</SpecTile>
    </div>`,
  }),
};
