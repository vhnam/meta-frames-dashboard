import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { useQuery } from '@tanstack/vue-query';
import type { ConcreteComponent } from 'vue';

import QueryBoundary from './QueryBoundary.vue';

type State = 'loading' | 'error' | 'empty' | 'success';
type Props = { state: State; emptyText?: string; skeletonRows?: number; quiet?: boolean };

type Roll = { id: string; stock: string; camera: string };

const ROLLS: Roll[] = [
  { id: 'roll-1', stock: 'Kodak Portra 400', camera: 'Nikon F3' },
  { id: 'roll-2', stock: 'Ilford HP5 Plus', camera: 'Pentax 67' },
];

// Real queries against the story QueryClient from preview.ts; no network.
const fetchers: Record<State, () => Promise<Roll[]>> = {
  loading: () => new Promise<Roll[]>(() => {}),
  error: () => Promise.reject(new Error('Network request failed')),
  empty: () => Promise.resolve([]),
  success: () => Promise.resolve(ROLLS),
};

const meta = {
  // Generic SFC: Storybook cannot infer its props, so type it with the story args.
  component: QueryBoundary as unknown as ConcreteComponent<Props>,
  tags: ['autodocs'],
  args: { state: 'success' },
  argTypes: {
    state: { control: 'select', options: ['loading', 'error', 'empty', 'success'] },
    emptyText: { control: 'text' },
    skeletonRows: { control: 'number' },
    quiet: { control: 'boolean' },
  },
  render: (args) => ({
    components: { QueryBoundary },
    setup: () => {
      const query = useQuery({
        queryKey: ['story', 'query-boundary', () => args.state],
        queryFn: () => fetchers[args.state](),
      });
      return { args, query };
    },
    template: `<QueryBoundary :query="query" :empty-text="args.emptyText" :skeleton-rows="args.skeletonRows" :quiet="args.quiet">
      <template #default="{ data }">
        <ul class="grid gap-2 text-sm">
          <li v-for="roll in data" :key="roll.id" class="rounded-md border p-3">{{ roll.stock }} · {{ roll.camera }}</li>
        </ul>
      </template>
    </QueryBoundary>`,
  }),
} satisfies Meta<Props>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = { args: { state: 'loading' } };
export const Failed: Story = { args: { state: 'error' } };
export const Empty: Story = { args: { state: 'empty', emptyText: 'No rolls yet.' } };
export const Success: Story = {};
