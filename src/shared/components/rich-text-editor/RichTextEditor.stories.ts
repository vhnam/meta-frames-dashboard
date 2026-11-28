import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import RichTextEditor from './RichTextEditor.vue';

type Props = {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  inputId?: string;
  labelledBy?: string;
  describedBy?: string;
  autofocus?: boolean;
};

const meta = {
  component: RichTextEditor,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { modelValue: '', placeholder: 'Condition, quirks, light seals, meter accuracy…' },
  argTypes: { modelValue: { control: 'text' } },
  render: (args) => ({
    components: { RichTextEditor },
    setup: () => {
      const markdown = ref(args.modelValue ?? '');
      // follow the Controls panel too, not only typing
      watch(
        () => args.modelValue,
        (next) => (markdown.value = next ?? ''),
      );
      return { args, markdown };
    },
    template: `<div class="grid max-w-xl gap-3">
      <span id="notes-label" class="text-sm font-medium">Camera notes</span>
      <RichTextEditor v-bind="args" v-model="markdown" labelled-by="notes-label" />
      <pre class="rounded-md bg-muted p-3 text-xs whitespace-pre-wrap" aria-label="Markdown model value">{{ markdown || '(empty)' }}</pre>
    </div>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = {
  args: {
    modelValue:
      '**Light seals replaced** in 2024.\n\n- Meter reads half a stop high\n- Shutter 1/1000 sticks',
  },
};
export const Disabled: Story = {
  args: { disabled: true, modelValue: 'Sold with the 50mm f/1.8.' },
};
