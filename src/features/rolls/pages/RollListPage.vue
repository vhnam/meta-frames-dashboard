<script setup lang="ts">
import { useStockList, type FilmStock, type FilmType } from "#/features/film-stocks";
import { useRollList } from "../queries";
import { ROLL_STATUSES, isRollComplete, negativesStillAtLab } from "../types";
import type { RollRow, RollStatus } from "../types";
import { expiryFromNow, formatExpiry, isExpired } from "../format";
import {
  groupByStock,
  groupSummary,
  matchesStockFilters,
  rollsInView,
  type ExpiryFilter,
  type RollListSearch,
} from "../rollList";
import { Link, useRouter } from "@tanstack/vue-router";
import { IconArrowLeft } from "@tabler/icons-vue";
import { computed, h, ref, watch } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import AddButton from "#/shared/components/AddButton.vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import { PRIMARY_LINK, numberCell, stackCell, tagCell } from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import RollStatusBadge from "../components/RollStatusBadge.vue";
import AddRollsDialog from "../components/AddRollsDialog.vue";
import InStockGroups from "../components/InStockGroups.vue";
import { cn } from "#/shared/lib/utils";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
import { Label } from "#/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";
import { Switch } from "#/shared/ui/switch";
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
const inTab = (rows: RollRow[], tabValue: RollTab) =>
  tabValue === "all" ? rows : rows.filter((row) => row.roll.status === tabValue);

const props = withDefaults(defineProps<{ search?: RollListSearch }>(), { search: () => ({}) });

// The URL holds the state (reload, bookmark, Back); the local copy also lets tests run without a router.
const state = ref<RollListSearch>(props.search);
// a page change also makes a new search object: keep `state` (and so the rows) unless a Rolls key changed
watch(
  () => props.search,
  (search) => {
    if (JSON.stringify(search) !== JSON.stringify(state.value)) state.value = search;
  },
);
const router = useRouter({ warn: false });
/** A new view or filter starts on page 1 (page dropped); the page size stays. */
function go(next: RollListSearch, replace = false) {
  state.value = next;
  void router?.navigate({
    to: "/app/rolls",
    search: (prev: { pageSize?: number }) => ({ ...next, pageSize: prev.pageSize }),
    replace,
  });
}

const tab = computed<RollTab>(() => state.value.tab ?? "all");
const setTab = (value: unknown) => go(value === "all" ? {} : { tab: value as RollStatus });

const EXPIRY_OPTIONS: { value: ExpiryFilter | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "expired", label: "Expired" },
  { value: "soon", label: "Expiring soon" },
  { value: "alert", label: "Expired or expiring soon" },
  { value: "undated", label: "No expiry date" },
];
const setExpiry = (value: unknown) => {
  const { expiry: _old, ...rest } = state.value;
  go(value === "all" ? rest : { ...rest, expiry: value as ExpiryFilter }, true);
};
const setGrouped = (grouped: boolean) =>
  go({ tab: "in_stock", expiry: state.value.expiry, group: grouped ? "stock" : undefined });
const openGroup = (stockId: string) => go({ ...state.value, stock: stockId });
const closeGroup = () => {
  const { stock: _open, ...rest } = state.value;
  go(rest);
};
const groupFilters = computed({
  get: () => {
    const { type, process, iso } = state.value;
    return Object.fromEntries(
      Object.entries({ type, process, iso }).filter(([, value]) => value),
    ) as Record<string, string>;
  },
  set: (filters: Record<string, string>) =>
    go({ ...state.value, type: filters.type, process: filters.process, iso: filters.iso }, true),
});

const addOpen = ref(false);
const rolls = useRollList({});

// the list endpoint names the stock only; type and box ISO come from the stock list
const stocks = useStockList();
const stockById = computed(
  () => new Map((stocks.data.value ?? []).map(({ stock }) => [stock.id, stock])),
);

// Computed, not built in the template: the table goes back to page 1 whenever its data array
// changes identity, so the rows must change only when the rolls, stocks or filters do.
/** Rows of the open tab with the page's own filters (only the open tab renders). */
const activeRows = computed(() => rollsInView(rolls.data.value ?? [], state.value));
// the group table's Type, Process and ISO filters apply to an open group too, such as a bookmark
// whose stock no longer matches them
const openGroupRows = computed(() =>
  matchesStockFilters(stockById.value.get(state.value.stock ?? ""), state.value)
    ? activeRows.value.filter((row) => row.roll.stockId === state.value.stock)
    : [],
);
const groups = computed(() =>
  groupByStock(activeRows.value).map((group) => ({
    ...group,
    stock: stockById.value.get(group.stockId),
  })),
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

const openRoll = (row: RollRow) =>
  router?.navigate({ to: "/app/rolls/$rollId", params: { rollId: row.roll.id } });

const expiryColumn: DataTableColumn<RollRow> = {
  id: "expiry",
  header: "Expiry",
  // rows come sorted by expiry (undated last); a text sort would put "—" and years in the wrong place
  enableSorting: false,
  enableGlobalFilter: false,
  cell: ({ row: { original: row } }) =>
    stackCell(numberCell(formatExpiry(row.roll)), expiryFromNow(row.roll)),
};

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
        row.roll.status === "in_stock" && isExpired(row.roll)
          ? h(Badge, { variant: "destructive" }, () => "Expired")
          : null,
        negativesStillAtLab(row.roll.status, row.negativesAtLab)
          ? h(Badge, { variant: "outline" }, () => "Negatives at lab")
          : null,
        isRollComplete(row.roll.status, row.negativesAtLab)
          ? h(Badge, { variant: "secondary" }, () => "Complete")
          : null,
      ]),
  },
];

// in stock rolls have no camera or start date yet; expiry is what matters
const inStockColumns = columns
  .filter((column) => column.id !== "camera" && column.id !== "started")
  .toSpliced(2, 0, expiryColumn);
const columnsFor = (tabValue: RollTab) => (tabValue === "in_stock" ? inStockColumns : columns);

const emptyText = (tabValue: RollTab) =>
  tabValue === "all"
    ? state.value.complete
      ? "No complete rolls."
      : "No rolls yet. Add rolls to get started."
    : tabValue === "in_stock" && state.value.expiry
      ? "No rolls in stock match this expiry filter."
      : `No rolls ${STATUS_LABELS[tabValue].toLowerCase()}.`;
</script>

<template>
  <PageHeader title="Rolls" description="Every physical roll and where it is in its lifecycle.">
    <template #actions>
      <AddButton @click="addOpen = true">Add rolls</AddButton>
    </template>
  </PageHeader>

  <QueryBoundary :query="rolls" :is-empty="() => false">
    <template #default="{ data }">
      <Tabs :model-value="tab" class="gap-6" @update:model-value="setTab">
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
          <div v-if="tabItem.value === 'all'" class="mb-4 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              :aria-pressed="!!state.complete"
              :class="state.complete && 'border-primary bg-primary/10 text-primary'"
              @click="go(state.complete ? {} : { complete: true })"
            >
              Complete
            </Button>
          </div>
          <div
            v-else-if="tabItem.value === 'in_stock'"
            class="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            <div class="flex items-center gap-2">
              <Label for="roll-expiry-filter">Expiry</Label>
              <Select :model-value="state.expiry ?? 'all'" @update:model-value="setExpiry">
                <SelectTrigger id="roll-expiry-filter" size="sm" class="bg-card min-w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in EXPIRY_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex items-center gap-2">
              <Switch
                id="roll-group-by-stock"
                :model-value="state.group === 'stock'"
                @update:model-value="setGrouped"
              />
              <Label for="roll-group-by-stock">Group by stock</Label>
            </div>
          </div>

          <!-- the stock list gives Type, Process and ISO: show its loading and error state, not groups
               with empty filters. Mounted once it loads, so the rows arrive once and the restored
               page stays. -->
          <QueryBoundary
            v-if="tabItem.value === 'in_stock' && state.group === 'stock'"
            :query="stocks"
            :is-empty="() => false"
            quiet
          >
            <template v-if="state.stock">
              <div class="mb-4 flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" @click="closeGroup">
                  <IconArrowLeft aria-hidden="true" /> All stocks
                </Button>
                <h2 class="font-heading text-lg font-semibold">
                  {{ groupByStock(openGroupRows).map(groupSummary)[0] ?? "No matching rolls" }}
                </h2>
              </div>
              <DataTable
                filter-label="Roll"
                filter-placeholder="Search by stock or camera..."
                empty-title="No rolls"
                empty-text="No rolls of this stock match the filters."
                :columns="inStockColumns"
                :data="openGroupRows"
                :get-row-id="(row) => row.roll.id"
                :on-select="openRoll"
                :row-label="(row) => `Open ${row.stockName} roll`"
              />
            </template>
            <!-- keyed on the filter: a new filter remounts the table on page 1 -->
            <InStockGroups
              v-else
              :key="state.expiry"
              v-model:filters="groupFilters"
              :groups="groups"
              @open="openGroup"
            />
          </QueryBoundary>
          <DataTable
            v-else
            :key="`${state.expiry}-${state.complete}`"
            filter-label="Roll"
            filter-placeholder="Search by stock or camera..."
            empty-title="No rolls"
            :empty-text="emptyText(tabItem.value)"
            :columns="columnsFor(tabItem.value)"
            :data="activeRows"
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
