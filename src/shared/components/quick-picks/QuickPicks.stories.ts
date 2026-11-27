import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import QuickPicks from './QuickPicks.vue';

type Props = {
  values: readonly number[];
  current: unknown;
  label: string;
  format?: (value: number) => string;
};

const meta = {
  component: QuickPicks,
  tags: ['autodocs'],
  args: { values: [100, 200, 400, 800], current: 400, label: 'Common box speeds' },
  render: (args) => ({
    components: { QuickPicks },
    setup: () => {
      const picked = ref(args.current);
      // follow the Controls panel too, not only clicks
      watch(
        () => args.current,
        (value) => (picked.value = value),
      );
      return { args, picked };
    },
    template: `<QuickPicks v-bind="args" :current="picked" @pick="picked = $event" />`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NothingPicked: Story = { args: { current: '' } };
export const Formatted: Story = {
  args: {
    values: [28, 35, 50, 85],
    current: 50,
    label: 'Common focal lengths',
    format: (value) => `${value} mm`,
  },
};
