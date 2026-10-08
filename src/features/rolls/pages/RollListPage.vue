<script setup lang="ts">
import { useStockList, type FilmStock, type FilmType } from "#/features/film-stocks";
import { useDeleteRoll, useRollList } from "../queries";
import { ROLL_STATUSES } from "../types";
import type { RollRow, RollStatus } from "../types";
import { Link } from "@tanstack/vue-router";
import { computed, h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import AddButton from "#/shared/components/AddButton.vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import {
  PRIMARY_LINK,
  actionsColumn,
  numberCell,
  stackCell,
  tagCell,
} from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import RollStatusBadge from "../components/RollStatusBadge.vue";
import AddRollsDialog from "../components/AddRollsDialog.vue";
import RollEditDialog from "../components/RollEditDialog.vue";
import { cn } from "#/shared/lib/utils";
import { Badge } from "#/shared/ui/badge";
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

// the list endpoint names the stock only; type and box ISO come from the stock list
const stocks = useStockList();
const stockById = computed(
  () => new Map((stocks.data.value ?? []).map(({ stock }) => [stock.id, stock])),
);

const TYPE_TEXT: Record<FilmType, string> = {
  color: "Color Negative",
  bw: "B&W Negative",
  slide: "Color Slide",
};
function stockMeta(r: RollRow, st: FilmStock | undefined) {
  const iso = r.roll.shotIso ?? st?.boxIso;
  return [st && TYPE_TEXT[st.type], `${r.roll.exposures} Exp`, iso && `ISO ${iso}`]
    .filter(Boolean)
    .join(" · ");
}

const FORMAT_SIZE: Record<string, string> = {
  "135": "35mm",
  "120": "6cm",
  "110": "16mm",
  "4x5": "sheet",
};
const formatLabel = (f: string) => (FORMAT_SIZE[f] ? `${f} / ${FORMAT_SIZE[f]}` : f);

const tabCountClass = (t: RollTab, n: number) =>
  n === 0
    ? "text-muted-foreground/70 text-[0.7rem]"
    : t === "at_lab"
      ? "bg-destructive/15 text-destructive rounded-full px-1.5 text-xs font-semibold"
      : "bg-secondary text-foreground rounded-full px-1.5 text-xs font-semibold";

const negativesBadge = (r: RollRow) =>
  (r.roll.status === "scanned" || r.roll.status === "developed") && r.negativesAtLab;

const columns: DataTableColumn<RollRow>[] = [
  {
    id: "stock",
    header: "Stock",
    accessorFn: (r) => r.stockName,
    cell: ({ row: { original: r } }) => {
      const st = stockById.value.get(r.roll.stockId);
      return stackCell(
        h(
          Link,
          { to: "/app/rolls/$rollId", params: { rollId: r.roll.id }, class: PRIMARY_LINK },
          () => r.stockName,
        ),
        stockMeta(r, st),
      );
    },
  },
  {
    id: "format",
    enableSorting: false,
    header: "Format",
    accessorFn: (r) => r.roll.format,
    filterFn: "equalsString",
    enableGlobalFilter: false,
    meta: { filter: { label: "Format", placeholder: "All formats", format: formatLabel } },
    cell: ({ row: { original: r } }) => tagCell(formatLabel(r.roll.format)),
  },
  {
    id: "camera",
    header: "Camera",
    accessorFn: (r) => r.cameraName ?? "—",
    cell: ({ row: { original: r } }) =>
      stackCell(
        h(
          "span",
          { class: r.cameraName ? "font-medium" : "text-muted-foreground" },
          r.cameraName ?? "—",
        ),
        r.roll.description,
      ),
  },
  {
    id: "started",
    header: "Started",
    accessorFn: (r) => r.roll.startDate ?? "—",
    enableGlobalFilter: false,
    cell: ({ row: { original: r } }) => numberCell(r.roll.startDate),
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
  actionsColumn((r) => ({
    onEdit: () => edit(r),
    onDelete: async () => (await ask("Delete this roll?")) && deleteRoll.mutate(r.roll.id),
  })),
];
</script>

<template>
  <PageHeader title="Rolls" description="Every physical roll and where it is in its lifecycle.">
    <template #actions>
      <AddButton @click="addOpen = true">Add rolls</AddButton>
    </template>
  </PageHeader>

  <QueryBoundary :query="rolls" :is-empty="() => false">
    <template #default="{ data }">
      <Tabs v-model="tab" class="gap-6">
        <TabsList
          class="bg-muted h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg border p-1.5"
        >
          <TabsTrigger
            v-for="t in TABS"
            :key="t.value"
            :value="t.value"
            class="text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground h-10 flex-none gap-2.5 px-4 data-[state=active]:font-semibold"
          >
            {{ t.label }}
            <span :class="cn('tabular-nums', tabCountClass(t.value, inTab(data, t.value).length))">
              {{ inTab(data, t.value).length }}
            </span>
          </TabsTrigger>
        </TabsList>
        <!-- one DataTable per tab: each keeps its own pager, reset when the tab changes -->
        <TabsContent v-for="t in TABS" :key="t.value" :value="t.value">
          <DataTable
            filter-label="Roll"
            filter-placeholder="Search by stock or camera..."
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
