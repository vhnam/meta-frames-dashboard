import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Avatar, AvatarFallback, AvatarImage } from '.';

const meta = {
  component: Avatar,
  tags: ['autodocs'],
  render: () => ({
    components: { Avatar, AvatarFallback },
    template: `<Avatar class="size-9 rounded-md">
      <AvatarFallback class="rounded-md bg-secondary text-xs font-semibold">NV</AvatarFallback>
    </Avatar>`,
  }),
} satisfies Meta<{ class?: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

// Initials, as shown while a picture loads or when it fails.
export const Fallback: Story = {};

// Inline SVG with no fill color, so it holds no raw color value.
const picture = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="12" fill="currentColor"/></svg>',
)}`;

export const Loaded: Story = {
  render: () => ({
    components: { Avatar, AvatarFallback, AvatarImage },
    setup: () => ({ picture }),
    template: `<Avatar class="size-9 rounded-md">
      <AvatarImage :src="picture" alt="Nam Vo" class="rounded-md object-cover" />
      <AvatarFallback class="rounded-md bg-secondary text-xs font-semibold">NV</AvatarFallback>
    </Avatar>`,
  }),
};

export const FailedImage: Story = {
  render: () => ({
    components: { Avatar, AvatarFallback, AvatarImage },
    template: `<Avatar class="size-9 rounded-md">
      <AvatarImage src="data:image/png;base64,AA==" alt="" class="rounded-md object-cover" />
      <AvatarFallback class="rounded-md bg-secondary text-xs font-semibold">NV</AvatarFallback>
    </Avatar>`,
  }),
};
