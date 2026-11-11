<script setup lang="ts">
import { useStockList, type FilmStock, type FilmType } from "#/features/film-stocks";
import { useRollList } from "../queries";
import { ROLL_STAGES } from "../types";
import type { RollListRow, RollRow, RollStage } from "../types";
import { expiryFromNow, formatExpiry, isExpired } from "../format";
import {
  HAND_OVER_TABS,
  LIST_FILTER_KEYS,
  MAX_HAND_OVER,
  togglePicked,
  canHandOver,
  withoutListFilters,
  countByTab,
  groupByStock,
  groupSummary,
  groupedSearch,
  matchesStockFilters,
  rollsInView,
  type ActorFilter,
  type ExpiryFilter,
  type RollListSearch,
} from "../rollList";
import { Link, useRouter } from "@tanstack/vue-router";
import { IconArrowLeft, IconFilter, IconTruckDelivery } from "@tabler/icons-vue";
import { computed, h, ref, shallowRef, watch } from "vue";
import DataTable from "#/shared/components/DataTable.vue";
import type { DataTableColumn } from "#/shared/components/dataTable";
import AddButton from "#/shared/components/AddButton.vue";
import PageHeader from "#/shared/components/PageHeader.vue";
import { PRIMARY_LINK, numberCell, stackCell, tagCell } from "#/shared/components/tableCells";
import QueryBoundary from "#/shared/components/QueryBoundary.vue";
import RollStageBadge, { STAGE_LABELS } from "../components/RollStageBadge.vue";
import AddRollsDialog from "../components/AddRollsDialog.vue";
import HandOverDialog from "../components/HandOverDialog.vue";
import InStockGroups from "../components/InStockGroups.vue";
import { cn } from "#/shared/lib/utils";
import { Badge } from "#/shared/ui/badge";
import { Button } from "#/shared/ui/button";
import { Checkbox } from "#/shared/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/shared/ui/dropdown-menu";
import { Label } from "#/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/shared/ui/select";
import { Switch } from "#/shared/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/shared/ui/tabs";
import { plainText, formatDate } from "#/shared/lib/format";
import { notify } from "#/shared/lib/toast";

type RollTab = "all" | RollStage;
/** "All" first, then every stage in lifecycle order. */
const TABS: { value: RollTab; label: string }[] = [
  { value: "all", label: "All" },
  ...ROLL_STAGES.map((stage) => ({ value: stage, label: STAGE_LABELS[stage] })),
];

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
/** The shared filters stay with the new tab; the in-stock ones do not. */
const listFilters = computed(
  () =>
    Object.fromEntries(
      LIST_FILTER_KEYS.filter((key) => state.value[key]).map((key) => [key, state.value[key]]),
    ) as RollListSearch,
);
const setTab = (value: unknown) =>
  go(value === "all" ? listFilters.value : { ...listFilters.value, tab: value as RollStage });

const FLAG_FILTERS: { key: "atLab" | "needsScan" | "noPlan"; label: string }[] = [
  { key: "atLab", label: "Negatives at lab" },
  { key: "needsScan", label: "Needs scan" },
  { key: "noPlan", label: "No plan" },
];
const ACTOR_FILTER_KEYS: { key: "developBy" | "scanBy"; label: string }[] = [
  { key: "developBy", label: "Developed by" },
  { key: "scanBy", label: "Scanned by" },
];
const ACTOR_OPTIONS: { value: ActorFilter | "any"; label: string }[] = [
  { value: "any", label: "Anyone" },
  { value: "self", label: "Myself" },
  { value: "lab", label: "A lab" },
  { value: "unset", label: "Not decided" },
];
const activeFilterCount = computed(() => Object.keys(listFilters.value).length);
function setFilter(key: (typeof LIST_FILTER_KEYS)[number], value: unknown) {
  const { [key]: _old, ...rest } = state.value;
  const on = value !== undefined && value !== false && value !== "any";
  go(on ? { ...rest, [key]: value === true ? true : value } : rest, true);
}
const clearFilters = () => go(withoutListFilters(state.value), true);

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
const setGrouped = (grouped: boolean) => go(groupedSearch(state.value, grouped));
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
const counts = computed(() => countByTab(rolls.data.value ?? [], state.value));

// "Hand to lab": rows picked in the open tab; a new tab starts with none
const picked = ref(new Set<string>());
watch(tab, () => (picked.value = new Set()));
const pickable = (row: RollListRow) => canHandOver(row, state.value.tab);
function togglePick(row: RollListRow, on: boolean) {
  // starts from the picks still shown, so rolls a filter hides leave the pick and free their place
  const shown = new Set(pickedRows.value.map((picked) => picked.roll.id));
  const next = togglePicked(shown, row.roll.id, on);
  if (next) picked.value = next;
  else notify.error(`One handover takes at most ${MAX_HAND_OVER} rolls.`);
}
interface TableHandle {
  table: { getPrePaginatedRowModel: () => { rows: { original: RollListRow }[] } };
}
/** The open tab's table: its search and Format filter work inside it. */
const shownTable = shallowRef<TableHandle | null>(null);
const setShownTable = (tabValue: RollTab, table: unknown) => {
  if (tabValue === tab.value) shownTable.value = table as TableHandle | null;
};
/** Rows the table shows on any page: the page's filters, then the table's search and Format. */
const shownRows = computed(
  () =>
    shownTable.value?.table.getPrePaginatedRowModel().rows.map((row) => row.original) ??
    activeRows.value,
);
/** Only rows still shown and still pickable go: a filter, a search or a refresh may hide them. */
const pickedRows = computed(() =>
  shownRows.value.filter((row) => picked.value.has(row.roll.id) && pickable(row)),
);
const handOverOpen = ref(false);
const PICK_HINT: Partial<Record<RollStage, string>> = {
  processing: "Only rolls waiting for a scan can be handed to a lab.",
  completed: "Only rolls marked Needs scan can be handed to a lab.",
};
/** Why a row cannot be picked, or that only the lab holding its negatives can take it. */
const pickHint = (row: RollListRow) =>
  !pickable(row)
    ? PICK_HINT[row.stage]
    : row.negativesAtLab
      ? "Negatives are at a lab: only that lab can take this roll."
      : undefined;
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

const tabCountClass = (count: number) =>
  count === 0
    ? "text-muted-foreground/70 text-[0.7rem]"
    : "bg-secondary text-foreground rounded-full px-1.5 text-xs font-semibold";

const openRoll = (row: RollRow) =>
  router?.navigate({ to: "/app/rolls/$rollId", params: { rollId: row.roll.id } });

const expiryColumn: DataTableColumn<RollListRow> = {
  id: "expiry",
  header: "Expiry",
  // rows come sorted by expiry (undated last); a text sort would put "—" and years in the wrong place
  enableSorting: false,
  enableGlobalFilter: false,
  cell: ({ row: { original: row } }) =>
    stackCell(numberCell(formatExpiry(row.roll)), expiryFromNow(row.roll)),
};

const pickColumn: DataTableColumn<RollListRow> = {
  id: "pick",
  header: "",
  enableSorting: false,
  enableGlobalFilter: false,
  meta: { class: "w-px" },
  cell: ({ row: { original: row } }) =>
    h(Checkbox, {
      modelValue: picked.value.has(row.roll.id),
      disabled: !pickable(row),
      title: pickHint(row),
      "aria-label": [`Pick ${row.stockName} roll for Hand to lab`, pickHint(row)]
        .filter(Boolean)
        .join(". "),
      "onUpdate:modelValue": (on: boolean | "indeterminate") => togglePick(row, on === true),
    }),
};

const columns: DataTableColumn<RollListRow>[] = [
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
    accessorFn: (row) => STAGE_LABELS[row.stage],
    enableGlobalFilter: false,
    // one badge for the roll's stage; Expired is about the stock, not the stage
    cell: ({ row: { original: row } }) =>
      h("div", { class: "flex flex-wrap items-center gap-2" }, [
        h(RollStageBadge, { stage: row.stage, detail: row.stageDetail }),
        row.stage === "in_stock" && isExpired(row.roll)
          ? h(Badge, { variant: "destructive" }, () => "Expired")
          : null,
      ]),
  },
];

// in stock rolls have no camera or start date yet; expiry is what matters
const inStockColumns = columns
  .filter((column) => column.id !== "camera" && column.id !== "started")
  .toSpliced(2, 0, expiryColumn);
const pickColumns = [pickColumn, ...columns];
const columnsFor = (tabValue: RollTab) =>
  tabValue === "in_stock"
    ? inStockColumns
    : HAND_OVER_TABS.includes(tabValue as RollStage)
      ? pickColumns
      : columns;

const emptyText = (tabValue: RollTab) =>
  activeFilterCount.value
    ? "No rolls match these filters."
    : tabValue === "all"
      ? "No rolls yet. Add rolls to get started."
      : tabValue === "in_stock" && state.value.expiry
        ? "No rolls in stock match this expiry filter."
        : `No rolls ${STAGE_LABELS[tabValue].toLowerCase()}.`;
</script>

<template>
  <PageHeader title="Rolls" description="Every physical roll and where it is in its lifecycle.">
    <template #actions>
      <AddButton @click="addOpen = true">Add rolls</AddButton>
    </template>
  </PageHeader>

  <QueryBoundary :query="rolls" :is-empty="() => false">
    <template #default>
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
            <span :class="cn('tabular-nums', tabCountClass(counts[tabItem.value]))">
              {{ counts[tabItem.value] }}
            </span>
          </TabsTrigger>
        </TabsList>
        <div class="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                :class="activeFilterCount ? 'border-primary bg-primary/10 text-primary' : undefined"
              >
                <IconFilter aria-hidden="true" />
                Filters
                <span v-if="activeFilterCount" class="tabular-nums">({{ activeFilterCount }})</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-56">
              <DropdownMenuCheckboxItem
                v-for="filter in FLAG_FILTERS"
                :key="filter.key"
                :model-value="!!state[filter.key]"
                @update:model-value="(on: boolean) => setFilter(filter.key, on)"
                @select.prevent
              >
                {{ filter.label }}
              </DropdownMenuCheckboxItem>
              <template v-for="filter in ACTOR_FILTER_KEYS" :key="filter.key">
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{{ filter.label }}</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  :model-value="state[filter.key] ?? 'any'"
                  @update:model-value="(value) => setFilter(filter.key, value)"
                >
                  <DropdownMenuRadioItem
                    v-for="option in ACTOR_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                    @select.prevent
                  >
                    {{ option.label }}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </template>
              <template v-if="activeFilterCount">
                <DropdownMenuSeparator />
                <DropdownMenuItem @select="clearFilters">Clear filters</DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            v-if="HAND_OVER_TABS.includes(tab as RollStage)"
            size="sm"
            :disabled="!pickedRows.length"
            @click="handOverOpen = true"
          >
            <IconTruckDelivery aria-hidden="true" />
            Hand to lab
            <span v-if="pickedRows.length" class="tabular-nums">({{ pickedRows.length }})</span>
          </Button>
        </div>
        <!-- one DataTable per tab: each keeps its own pager, reset when the tab changes -->
        <TabsContent v-for="tabItem in TABS" :key="tabItem.value" :value="tabItem.value">
          <div
            v-if="tabItem.value === 'in_stock'"
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
            :ref="(table) => setShownTable(tabItem.value, table)"
            :key="`${state.expiry}-${activeFilterCount}`"
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
  <HandOverDialog v-model:open="handOverOpen" :rows="pickedRows" @handed="picked = new Set()" />
</template>
