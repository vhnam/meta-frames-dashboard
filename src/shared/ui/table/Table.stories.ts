import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { HTMLAttributes } from 'vue';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '.';

type Props = { class?: HTMLAttributes['class'] };

const parts = {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};

const meta = {
  component: Table,
  tags: ['autodocs'],
  render: (args) => ({
    components: parts,
    setup: () => ({
      args,
      rolls: [
        { id: 'R-101', stock: 'Portra 400', format: '35mm', frames: 36 },
        { id: 'R-102', stock: 'Tri-X 400', format: '120', frames: 12 },
        { id: 'R-103', stock: 'Ektar 100', format: '35mm', frames: 24 },
      ],
    }),
    template: `<Table v-bind="args">
      <TableCaption>Rolls in stock</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Roll</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Format</TableHead>
          <TableHead class="text-right">Frames</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="roll in rolls" :key="roll.id">
          <TableCell>{{ roll.id }}</TableCell>
          <TableCell>{{ roll.stock }}</TableCell>
          <TableCell>{{ roll.format }}</TableCell>
          <TableCell class="text-right">{{ roll.frames }}</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell :colspan="3">Total</TableCell>
          <TableCell class="text-right">72</TableCell>
        </TableRow>
      </TableFooter>
    </Table>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  render: (args) => ({
    components: parts,
    setup: () => ({ args }),
    template: `<Table v-bind="args">
      <TableHeader>
        <TableRow>
          <TableHead>Roll</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Format</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty :colspan="3">No rolls yet.</TableEmpty>
      </TableBody>
    </Table>`,
  }),
};
