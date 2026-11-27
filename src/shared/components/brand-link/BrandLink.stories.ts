import type { Meta, StoryObj } from '@storybook/vue3-vite';

import BrandLink from './BrandLink.vue';

const meta = {
  component: BrandLink,
  tags: ['autodocs'],
  render: () => ({
    components: { BrandLink },
    template: `<BrandLink />`,
  }),
} satisfies Meta<Record<string, never>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
