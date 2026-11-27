import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';

import type { DataTableColumn } from './dataTable';
import DataTable from './DataTable.vue';
import { mutedCell, numberCell, primaryText, stackCell, tagCell } from './tableCells';

type Roll = { id: string; stock: string; camera: string; format: string; frames: number };

type Props = {
  columns: DataTableColumn<Roll>[];
  data: readonly Roll[];
  filterLabel?: string;
  filterPlaceholder?: string;
  emptyTitle?: string;
  emptyText?: string;
  hideFilters?: boolean;
  selectedRowId?: string;
};

const STOCKS = ['Kodak Portra 400', 'Ilford HP5 Plus', 'Fujifilm Velvia 50', 'Kodak Tri-X 400'];
const CAMERAS = ['Nikon F3', 'Pentax 67', 'Leica M6'];

const rolls: Roll[] = Array.from({ length: 25 }, (_, index) => ({
  id: `roll-${index + 1}`,
  stock: STOCKS[index % STOCKS.length],
  camera: CAMERAS[index % CAMERAS.length],
  format: index % 3 === 1 ? '120' : '35mm',
  frames: index % 3 === 1 ? 10 : 36,
}));

const columns: DataTableColumn<Roll>[] = [
  {
    id: 'stock',
    header: 'Stock',
    accessorFn: (roll) => roll.stock,
    cell: ({ row }) => stackCell(primaryText(row.original.stock), row.original.camera),
  },
  {
    id: 'format',
    header: 'Format',
    accessorFn: (roll) => roll.format,
    cell: ({ row }) => tagCell(row.original.format),
    meta: { filter: { label: 'Format', placeholder: 'All formats' } },
  },
  {
    id: 'camera',
    header: 'Camera',
    accessorFn: (roll) => roll.camera,
    cell: ({ row }) => mutedCell(row.original.camera),
  },
  {
    id: 'frames',
    header: 'Frames',
    accessorFn: (roll) => roll.frames,
    cell: ({ row }) => numberCell(row.original.frames),
    meta: { align: 'right' },
  },
];

// The router comes from the global router decorator (the table keeps page and page size in the URL).
const meta = {
  component: DataTable,
  tags: ['autodocs'],
  args: {
    columns,
    data: rolls.slice(0, 6),
    filterLabel: 'Roll',
    filterPlaceholder: 'Search rolls…',
  },
  argTypes: {
    filterLabel: { control: 'text' },
    filterPlaceholder: { control: 'text' },
    emptyTitle: { control: 'text' },
    emptyText: { control: 'text' },
    hideFilters: { control: 'boolean' },
    selectedRowId: { control: 'text' },
  },
  render: (args) => ({
    components: { DataTable },
    setup: () => ({ args }),
    template: `<DataTable v-bind="args" />`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {};

export const Empty: Story = {
  args: { data: [], emptyTitle: 'No rolls', emptyText: 'Add a roll to get started.' },
};

// 25 rows against a page size of 10: three pages.
export const Paginated: Story = { args: { data: rolls } };

export const HiddenFilters: Story = { args: { hideFilters: true } };

export const Selectable: Story = {
  args: { selectedRowId: 'roll-2' },
  render: (args) => ({
    components: { DataTable },
    setup: () => {
      const selectedId = ref(args.selectedRowId);
      // A Controls change replaces the row a click selected.
      watch(
        () => args.selectedRowId,
        (rowId) => (selectedId.value = rowId),
      );
      return {
        args,
        selectedId,
        getRowId: (row: Roll) => row.id,
        rowLabel: (row: Roll) => `Open ${row.stock}`,
        select: (row: Roll) => (selectedId.value = row.id),
      };
    },
    template: `<DataTable v-bind="args" :get-row-id="getRowId" :row-label="rowLabel" :selected-row-id="selectedId" :on-select="select" />`,
  }),
};
