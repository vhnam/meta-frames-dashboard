import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { Button } from '#/shared/ui/button';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '.';

const parts = {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};

const meta = {
  component: Card,
  tags: ['autodocs'],
  render: () => ({
    components: parts,
    template: `<Card class="max-w-sm">
      <CardHeader>
        <CardTitle>Processing history</CardTitle>
        <CardDescription>Jobs for this roll.</CardDescription>
        <CardAction><Button size="xs" variant="outline">Add</Button></CardAction>
      </CardHeader>
      <CardContent>No jobs yet.</CardContent>
      <CardFooter><Button variant="secondary">Close</Button></CardFooter>
    </Card>`,
  }),
} satisfies Meta<{ class?: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ContentOnly: Story = {
  render: () => ({
    components: parts,
    template: `<Card class="max-w-sm"><CardContent>Content only.</CardContent></Card>`,
  }),
};
