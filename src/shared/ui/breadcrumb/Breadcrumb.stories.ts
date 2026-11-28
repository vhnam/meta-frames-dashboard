import type { Meta, StoryObj } from '@storybook/vue3-vite';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '.';

const parts = {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};

const meta = {
  component: Breadcrumb,
  tags: ['autodocs'],
  render: () => ({
    components: parts,
    template: `<Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="#">Rolls</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>Roll 12</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>`,
  }),
} satisfies Meta<{ class?: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// The dashboard header shows only the current page title.
export const CurrentPageOnly: Story = {
  render: () => ({
    components: parts,
    template: `<Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbPage class="text-sm">Rolls</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>`,
  }),
};
