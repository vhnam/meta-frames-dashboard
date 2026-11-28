import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '.';

type Props = {
  page?: number;
  total?: number;
  itemsPerPage?: number;
  siblingCount?: number;
  showEdges?: boolean;
  disabled?: boolean;
};

const parts = {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
};

const meta = {
  component: Pagination,
  tags: ['autodocs'],
  args: { page: 1, total: 100, itemsPerPage: 10, siblingCount: 1, showEdges: true },
  render: (args) => ({
    components: parts,
    setup: () => {
      const page = ref(args.page ?? 1);
      // follow the Controls panel too, not only clicks
      watch(
        () => args.page,
        (value) => (page.value = value ?? 1),
      );
      return { args, page };
    },
    template: `<Pagination v-bind="args" :page="page" @update:page="page = $event" v-slot="{ page: current }">
      <PaginationContent v-slot="{ items }">
        <PaginationFirst />
        <PaginationPrevious />
        <template v-for="(item, index) in items" :key="index">
          <PaginationItem v-if="item.type === 'page'" :value="item.value" :is-active="item.value === current">
            {{ item.value }}
          </PaginationItem>
          <PaginationEllipsis v-else :index="index" />
        </template>
        <PaginationNext />
        <PaginationLast />
      </PaginationContent>
    </Pagination>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const MiddlePage: Story = { args: { page: 6 } };
export const LastPage: Story = { args: { page: 10 } };
export const FewPages: Story = { args: { total: 30 } };
export const Disabled: Story = { args: { disabled: true } };
