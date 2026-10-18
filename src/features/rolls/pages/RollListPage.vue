<script setup lang="ts">
import { useStockList, type FilmStock, type FilmType } from "#/features/film-stocks";
import { useRollList } from "../queries";
import { ROLL_STATUSES } from "../types";
import type { RollRow, RollStatus } from "../types";
import { Link, useRouter } from "@tanstack/vue-router";
import { computed, h, ref } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import AddButton from "#/shared/components/AddButton.vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import { PRIMARY_LINK, numberCell, stackCell, tagCell } from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import RollStatusBadge from "../components/RollStatusBadge.vue";
import AddRollsDialog from "../components/AddRollsDialog.vue";
import { cn } from "#/shared/lib/utils";
import { Badge } from "#/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/shared/ui/tabs";
import { plainText, formatDate } from "#/shared/lib/format";

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
  ...ROLL_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
];
const tab = ref<RollTab>("all");
const inTab = (rows: RollRow[], tabValue: RollTab) =>
  tabValue === "all" ? rows : rows.filter((row) => row.roll.status === tabValue);

const addOpen = ref(false);
const rolls = useRollList({});

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
function stockMeta(row: RollRow, st: FilmStock | undefined) {
  const iso = row.roll.shotIso ?? st?.boxIso;
  return [st && TYPE_TEXT[st.type], `${row.roll.exposures} Exp`, iso && `ISO ${iso}`]
    .filter(Boolean)
    .join(" · ");
}

const FORMAT_SIZE: Record<string, string> = {
  "135": "35mm",
  "120": "6cm",
  "110": "16mm",
  "4x5": "sheet",
};
const formatLabel = (format: string) =>
  FORMAT_SIZE[format] ? `${format} / ${FORMAT_SIZE[format]}` : format;

const tabCountClass = (tabValue: RollTab, count: number) =>
  count === 0
    ? "text-muted-foreground/70 text-[0.7rem]"
    : tabValue === "at_lab"
      ? "bg-destructive/15 text-destructive rounded-full px-1.5 text-xs font-semibold"
      : "bg-secondary text-foreground rounded-full px-1.5 text-xs font-semibold";

const negativesBadge = (row: RollRow) =>
  (row.roll.status === "scanned" || row.roll.status === "developed") && row.negativesAtLab;

const router = useRouter();
const openRoll = (row: RollRow) =>
  router.navigate({ to: "/app/rolls/$rollId", params: { rollId: row.roll.id } });

const columns: DataTableColumn<RollRow>[] = [
  {
    id: "stock",
    header: "Stock",
    accessorFn: (row) => row.stockName,
    cell: ({ row: { original: row } }) => {
      const st = stockById.value.get(row.roll.stockId);
      return stackCell(
        h(
          Link,
          { to: "/app/rolls/$rollId", params: { rollId: row.roll.id }, class: PRIMARY_LINK },
          () => row.stockName,
        ),
        stockMeta(row, st),
      );
    },
  },
  {
    id: "format",
    enableSorting: false,
    header: "Format",
    accessorFn: (row) => row.roll.format,
    filterFn: "equalsString",
    enableGlobalFilter: false,
    meta: { filter: { label: "Format", placeholder: "All formats", format: formatLabel } },
    cell: ({ row: { original: row } }) => tagCell(formatLabel(row.roll.format)),
  },
  {
    id: "camera",
    header: "Camera",
    accessorFn: (row) => row.cameraName ?? "—",
    cell: ({ row: { original: row } }) =>
      stackCell(
        h(
          "span",
          { class: row.cameraName ? "font-medium" : "text-muted-foreground" },
          row.cameraName ?? "—",
        ),
        plainText(row.roll.description),
      ),
  },
  {
    id: "started",
    header: "Started",
    // ISO dates sort as text; the cell shows dd/mm/yyyy
    accessorFn: (row) => row.roll.startDate ?? "",
    enableGlobalFilter: false,
    cell: ({ row: { original: row } }) => numberCell(formatDate(row.roll.startDate)),
  },
  {
    id: "status",
    enableSorting: false,
    header: "Status",
    accessorFn: (row) => STATUS_LABELS[row.roll.status],
    filterFn: "equalsString",
    enableGlobalFilter: false,
    cell: ({ row: { original: row } }) =>
      h("div", { class: "flex flex-wrap items-center gap-2" }, [
        h(RollStatusBadge, { status: row.roll.status }),
        negativesBadge(row) ? h(Badge, { variant: "outline" }, () => "Negatives at lab") : null,
      ]),
  },
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
            v-for="tabItem in TABS"
            :key="tabItem.value"
            :value="tabItem.value"
            class="text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground h-10 flex-none gap-2.5 px-4 data-[state=active]:font-semibold"
          >
            {{ tabItem.label }}
            <span
              :class="
                cn('tabular-nums', tabCountClass(tabItem.value, inTab(data, tabItem.value).length))
              "
            >
              {{ inTab(data, tabItem.value).length }}
            </span>
          </TabsTrigger>
        </TabsList>
        <!-- one DataTable per tab: each keeps its own pager, reset when the tab changes -->
        <TabsContent v-for="tabItem in TABS" :key="tabItem.value" :value="tabItem.value">
          <DataTable
            filter-label="Roll"
            filter-placeholder="Search by stock or camera..."
            empty-title="No rolls"
            :empty-text="
              tabItem.value === 'all'
                ? 'No rolls yet. Add rolls to get started.'
                : `No rolls ${STATUS_LABELS[tabItem.value].toLowerCase()}.`
            "
            :columns="columns"
            :data="inTab(data, tabItem.value)"
            :get-row-id="(row) => row.roll.id"
            :on-select="openRoll"
            :row-label="(row) => `Open ${row.stockName} roll`"
          />
        </TabsContent>
      </Tabs>
    </template>
  </QueryBoundary>
  <AddRollsDialog v-model:open="addOpen" />
</template>
