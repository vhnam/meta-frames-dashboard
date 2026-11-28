import type { Meta, StoryObj } from '@storybook/vue3-vite';

import AddButton from '../add-button/AddButton.vue';
import PageHeader from './PageHeader.vue';

type Props = { title: string; description?: string };

const meta = {
  component: PageHeader,
  tags: ['autodocs'],
  args: { title: 'Rolls', description: 'Every roll you have shot, from loaded to scanned.' },
  render: (args) => ({
    components: { PageHeader },
    setup: () => ({ args }),
    template: `<PageHeader v-bind="args" />`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoDescription: Story = { args: { description: undefined } };

export const WithActions: Story = {
  render: (args) => ({
    components: { PageHeader, AddButton },
    setup: () => ({ args }),
    template: `<PageHeader v-bind="args"><template #actions><AddButton>Add roll</AddButton></template></PageHeader>`,
  }),
};
