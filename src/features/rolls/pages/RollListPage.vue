<script setup lang="ts">
import { useDeleteRoll, useRollList } from "../queries";
import { ROLL_STATUSES } from "../types";
import type { RollRow, RollStatus } from "../types";
import { Link } from "@tanstack/vue-router";
import { h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import PageHeader from "#/shared/components/PageHeader.vue";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import RollStatusBadge from "../components/RollStatusBadge.vue";
import AddRollsDialog from "../components/AddRollsDialog.vue";
import RollEditDialog from "../components/RollEditDialog.vue";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/shared/ui/tabs";
import { ask } from "#/shared/lib/ui";

const STATUS_LABELS: Record<RollStatus, string> = {
  in_stock: "In stock",
  in_camera: "In camera",
  done_shooting: "Done shooting",
  at_lab: "At lab",
  developed: "Developed",
  scanned: "Scanned",
};

type RollTab = "all" | RollStatus;
/** "All" first, then every status in lifecycle order. */
const TABS: { value: RollTab; label: string }[] = [
  { value: "all", label: "All" },
  ...ROLL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];
const tab = ref<RollTab>("all");
const inTab = (rows: RollRow[], t: RollTab) =>
  t === "all" ? rows : rows.filter((r) => r.roll.status === t);

const addOpen = ref(false);
const rolls = useRollList({});
const deleteRoll = useDeleteRoll();
const editing = ref<RollRow>();
const editOpen = ref(false);
function edit(row: RollRow) {
  editing.value = row;
  editOpen.value = true;
}

const negativesBadge = (r: RollRow) =>
  (r.roll.status === "scanned" || r.roll.status === "developed") && r.negativesAtLab;

const columns: DataTableColumn<RollRow>[] = [
  {
    id: "stock",
    header: "Stock",
    accessorFn: (r) => r.stockName,
    cell: ({ row: { original: r } }) =>
      h(
        Link,
        {
          to: "/rolls/$rollId",
          params: { rollId: r.roll.id },
          class: "font-medium hover:underline",
        },
        () => r.stockName,
      ),
  },
  {
    id: "format",
    enableSorting: false,
    header: "Format",
    accessorFn: (r) => r.roll.format,
    filterFn: "equalsString",
    enableGlobalFilter: false,
    meta: { filter: { label: "Format", placeholder: "All formats" } },
  },
  { id: "camera", header: "Camera", accessorFn: (r) => r.cameraName ?? "—" },
  {
    id: "started",
    header: "Started",
    accessorFn: (r) => r.roll.startDate ?? "—",
    enableGlobalFilter: false,
  },
  {
    id: "status",
    enableSorting: false,
    header: "Status",
    accessorFn: (r) => STATUS_LABELS[r.roll.status],
    filterFn: "equalsString",
    enableGlobalFilter: false,
    cell: ({ row: { original: r } }) =>
      h("div", { class: "flex flex-wrap items-center gap-2" }, [
        h(RollStatusBadge, { status: r.roll.status }),
        negativesBadge(r) ? h(Badge, { variant: "outline" }, () => "Negatives at lab") : null,
      ]),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row: { original: r } }) =>
      h("div", { class: "space-x-1 text-right" }, [
        h(Button, { size: "sm", variant: "outline", onClick: () => edit(r) }, () => "Edit"),
        h(
          Button,
          {
            size: "sm",
            variant: "ghost",
            onClick: () => ask("Delete this roll?") && deleteRoll.mutate(r.roll.id),
          },
          () => "Delete",
        ),
      ]),
  },
];
</script>

<template>
  <PageHeader title="Rolls" description="Every physical roll and where it is in its lifecycle.">
    <template #actions>
      <Button @click="addOpen = true">Add rolls</Button>
    </template>
  </PageHeader>

  <QueryBoundary :query="rolls" :is-empty="() => false">
    <template #default="{ data }">
      <Tabs v-model="tab">
        <TabsList>
          <TabsTrigger v-for="t in TABS" :key="t.value" :value="t.value">
            {{ t.label }}
            <Badge variant="outline" class="bg-background px-1.5 tabular-nums">
              {{ inTab(data, t.value).length }}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <!-- one DataTable per tab: each keeps its own pager, reset when the tab changes -->
        <TabsContent v-for="t in TABS" :key="t.value" :value="t.value">
          <DataTable
            filter-label="Roll"
            filter-placeholder="Search stock or camera…"
            empty-title="No rolls"
            :empty-text="
              t.value === 'all'
                ? 'No rolls yet. Add rolls to get started.'
                : `No rolls ${STATUS_LABELS[t.value].toLowerCase()}.`
            "
            :columns="columns"
            :data="inTab(data, t.value)"
            :get-row-id="(r) => r.roll.id"
          />
        </TabsContent>
      </Tabs>
    </template>
  </QueryBoundary>
  <AddRollsDialog v-model:open="addOpen" />
  <RollEditDialog v-model:open="editOpen" :row="editing" />
</template>
