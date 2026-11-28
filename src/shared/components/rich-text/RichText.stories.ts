import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { RichText } from './richText';

type Props = { markdown: string };

const meta = {
  component: RichText,
  tags: ['autodocs'],
  args: { markdown: 'Pushed one stop. Scanned at the lab on a Frontier.' },
  argTypes: { markdown: { control: 'text' } },
  render: (args) => ({
    components: { RichText },
    setup: () => ({ args }),
    template: `<RichText v-bind="args" />`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlainText: Story = {};

export const Formatted: Story = {
  args: {
    markdown: [
      '## Roll notes',
      '',
      'Shot on a **Nikon F3** with the 50 mm, mostly *overcast* light.',
      '',
      '- Pushed one stop to ISO 800',
      '- Lab: [Harman Lab](https://example.com)',
      '',
      '1. Load',
      '2. Shoot',
      '3. Develop',
    ].join('\n'),
  },
};
