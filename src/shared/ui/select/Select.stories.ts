import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '.';

type Props = {
  modelValue?: string;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
};

const parts = {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};

const renderSelect = (triggerAttrs: string) => (args: Props) => ({
  components: parts,
  setup: () => {
    const value = ref(args.modelValue);
    // follow the Controls panel too, not only clicks
    watch(
      () => args.modelValue,
      (next) => (value.value = next),
    );
    return { args, value };
  },
  template: `<Select v-bind="args" :model-value="value" @update:model-value="value = String($event)">
      <SelectTrigger class="w-56" aria-label="Film format" ${triggerAttrs}>
        <SelectValue placeholder="Pick a film format" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Roll film</SelectLabel>
          <SelectItem value="35mm">35mm</SelectItem>
          <SelectItem value="120">120</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Sheet film</SelectLabel>
          <SelectItem value="4x5">4x5</SelectItem>
          <SelectItem value="8x10" disabled>8x10</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>`,
});

const meta = {
  component: Select,
  tags: ['autodocs'],
  // explicit control: stories without a modelValue arg (Placeholder, Invalid) still get one
  argTypes: { modelValue: { control: 'select', options: ['35mm', '120', '4x5'] } },
  render: renderSelect(''),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};
export const Selected: Story = { args: { modelValue: '120' } };
export const Disabled: Story = { args: { disabled: true, modelValue: '35mm' } };

export const Invalid: Story = { render: renderSelect('aria-invalid="true"') };

// An open list would cover the docs page, so autodocs skips this story.
export const Open: Story = {
  tags: ['!autodocs'],
  args: { defaultOpen: true },
};
