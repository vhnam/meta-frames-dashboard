import { FILM_TYPE_LABELS, type FilmStock } from "#/features/film-stocks/types";
import { byExpiry, expiryState, formatExpiry } from "./format";
import { FORMATS, ROLL_STAGES } from "./types";
import type { ProcessingType, Roll, RollListRow, RollRow, RollStage, StepActor } from "./types";

/** In-stock expiry filter; `alert` is "expired or expiring soon", as the alerts bell counts. */
export const EXPIRY_FILTERS = ["expired", "soon", "alert", "undated"] as const;
export type ExpiryFilter = (typeof EXPIRY_FILTERS)[number];

/** Plan filter on who does a step; `unset` is "not decided yet". */
export const ACTOR_FILTERS = ["self", "lab", "unset"] as const;
export type ActorFilter = (typeof ACTOR_FILTERS)[number];

/** Filters that apply on every tab, and so stay when the tab changes. */
export const LIST_FILTER_KEYS = ["atLab", "needsScan", "noPlan", "developBy", "scanBy"] as const;

/** Rolls page state carried on the URL. Defaults are left off. */
export interface RollListSearch {
  tab?: RollStage;
  /** A lab holds the negatives. */
  atLab?: true;
  /** Marked for a scan that has not started. */
  needsScan?: true;
  /** No target chosen yet. */
  noPlan?: true;
  developBy?: ActorFilter;
  scanBy?: ActorFilter;
  /** "In stock" tab from here on. */
  expiry?: ExpiryFilter;
  group?: "stock";
  /** The open stock group. */
  stock?: string;
  /** Group table column filters. */
  type?: string;
  process?: string;
  /** Text, not a number: a box ISO can be a range such as `100-400`. */
  iso?: string;
}

const text = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) || undefined : undefined;

export function parseRollListSearch(search: Record<string, unknown>): RollListSearch {
  const tab = ROLL_STAGES.find((stage) => stage === search.tab);
  const out: RollListSearch = {};
  if (tab) out.tab = tab;
  for (const key of ["atLab", "needsScan", "noPlan"] as const)
    if (search[key] === true || search[key] === "true") out[key] = true;
  for (const key of ["developBy", "scanBy"] as const) {
    const actor = ACTOR_FILTERS.find((filter) => filter === search[key]);
    if (actor) out[key] = actor;
  }
  if (tab !== "in_stock") return out;
  const expiry = EXPIRY_FILTERS.find((filter) => filter === search.expiry);
  if (expiry) out.expiry = expiry;
  if (search.group === "stock") out.group = "stock";
  for (const key of ["stock", "type", "process", "iso"] as const) {
    const value = text(search[key]);
    if (value) out[key] = value;
  }
  return out;
}

type ExpiryFields = Pick<Roll, "expiryYear" | "expiryMonth">;

export function matchesExpiry(roll: ExpiryFields, filter: ExpiryFilter | undefined, now?: Date) {
  if (!filter) return true;
  const state = expiryState(roll, now);
  return filter === "alert" ? state === "expired" || state === "soon" : state === filter;
}

/** The search without the shared filters; the tab and the in-stock filters stay. */
export function withoutListFilters(search: RollListSearch): RollListSearch {
  const rest = { ...search };
  for (const key of LIST_FILTER_KEYS) delete rest[key];
  return rest;
}

/** In stock with grouping on or off: the expiry and the shared filters stay, an open group closes. */
export function groupedSearch(search: RollListSearch, grouped: boolean): RollListSearch {
  const shared = Object.fromEntries(
    LIST_FILTER_KEYS.filter((key) => search[key] !== undefined).map((key) => [key, search[key]]),
  ) as RollListSearch;
  return {
    ...shared,
    tab: "in_stock",
    expiry: search.expiry,
    group: grouped ? "stock" : undefined,
  };
}

const matchesActor = (actor: StepActor | null, filter: ActorFilter | undefined) =>
  !filter || (filter === "unset" ? actor === null : actor === filter);

/** The filters every tab shares (not the in-stock expiry filter). */
export const matchesListFilters = (row: RollListRow, search: RollListSearch) =>
  (!search.atLab || row.negativesAtLab) &&
  (!search.needsScan || row.needsScan) &&
  (!search.noPlan || row.plan.target === null) &&
  matchesActor(row.plan.developBy, search.developBy) &&
  matchesActor(row.plan.scanBy, search.scanBy);

/** Rolls per tab under the shared filters; the stage tabs add up to "all". */
export function countByTab(rows: RollListRow[], search: RollListSearch) {
  const counts = Object.fromEntries(["all", ...ROLL_STAGES].map((tab) => [tab, 0])) as Record<
    "all" | RollStage,
    number
  >;
  for (const row of rows) {
    if (!matchesListFilters(row, search)) continue;
    counts.all += 1;
    counts[row.stage] += 1;
  }
  return counts;
}

/** Rows shown in a tab, before the table's own search and column filters. */
export function rollsInView(
  rows: RollListRow[],
  search: RollListSearch,
  now?: Date,
): RollListRow[] {
  const filtered = rows.filter((row) => matchesListFilters(row, search));
  if (!search.tab) return filtered;
  const inTab = filtered.filter((row) => row.stage === search.tab);
  if (search.tab !== "in_stock") return inTab;
  return inTab
    .filter((row) => matchesExpiry(row.roll, search.expiry, now))
    .sort((left, right) => byExpiry(left.roll, right.roll));
}

type StockFilterKey = "type" | "process" | "iso";

/** What the group table's Type, Process and ISO filters compare, per stock. */
export const STOCK_FILTER_VALUES: Record<StockFilterKey, (stock: FilmStock | undefined) => string> =
  {
    type: (stock) => (stock ? FILM_TYPE_LABELS[stock.type] : ""),
    process: (stock) => stock?.process ?? "",
    iso: (stock) => stock?.boxIso ?? "",
  };

/** The match the group table's column filters make (`equalsString`, which ignores case). */
export const matchesStockFilters = (stock: FilmStock | undefined, search: RollListSearch) =>
  (["type", "process", "iso"] as const).every((key) => {
    const filter = search[key];
    return !filter || STOCK_FILTER_VALUES[key](stock).toLowerCase() === filter.toLowerCase();
  });

export interface StockGroup {
  stockId: string;
  stockName: string;
  count: number;
  byFormat: Record<string, number>;
  /** Earliest known expiry among the group's rolls. */
  soonest: ExpiryFields | null;
}

/** One group per stock, by stock name. */
export function groupByStock(rows: RollRow[]): StockGroup[] {
  const groups = new Map<string, StockGroup>();
  for (const row of rows) {
    const group = groups.get(row.roll.stockId) ?? {
      stockId: row.roll.stockId,
      stockName: row.stockName,
      count: 0,
      byFormat: {},
      soonest: null,
    };
    group.count += 1;
    group.byFormat[row.roll.format] = (group.byFormat[row.roll.format] ?? 0) + 1;
    if (row.roll.expiryYear && (!group.soonest || byExpiry(row.roll, group.soonest) < 0))
      group.soonest = row.roll;
    groups.set(row.roll.stockId, group);
  }
  return [...groups.values()].sort((left, right) => left.stockName.localeCompare(right.stockName));
}

// FORMATS order (135 first); object keys alone would list "120" before "135"
const formatRank = (format: string) => {
  const index = (FORMATS as readonly string[]).indexOf(format);
  return index === -1 ? FORMATS.length : index;
};

export const formatCounts = (group: StockGroup) =>
  Object.entries(group.byFormat)
    .sort(([left], [right]) => formatRank(left) - formatRank(right))
    .map(([format, count]) => `${count} × ${format}`);

/** "ORWO NC500 · 3 × 135 · 2 × 120 · 12/2026" */
export const groupSummary = (group: StockGroup) =>
  [group.stockName, ...formatCounts(group), group.soonest && formatExpiry(group.soonest)]
    .filter(Boolean)
    .join(" · ");

/** Tabs where rolls can be picked for "Hand to lab". */
export const HAND_OVER_TABS: readonly RollStage[] = ["done_shooting", "processing", "completed"];

/**
 * Whether a row of a tab can be picked for "Hand to lab": a finished roll, a processing roll
 * waiting for its planned scan, or a completed roll marked for a scan.
 */
export function canHandOver(row: RollListRow, tab: RollStage | undefined): boolean {
  if (row.stage !== tab) return false;
  if (tab === "done_shooting") return true;
  if (tab === "processing") return row.stageDetail?.startsWith("waiting_") ?? false;
  if (tab === "completed") return row.needsScan;
  return false;
}

/** The most rolls one "Hand to lab" takes (the API's limit). */
export const MAX_HAND_OVER = 100;

/** The picked ids after a tick or untick; undefined when the tick would pass MAX_HAND_OVER. */
export function togglePicked(picked: ReadonlySet<string>, id: string, on: boolean) {
  if (on && !picked.has(id) && picked.size >= MAX_HAND_OVER) return undefined;
  const next = new Set(picked);
  if (on) next.add(id);
  else next.delete(id);
  return next;
}

/** Jobs a picked roll can go for: a finished roll is developed first, any other is scanned. */
export const handOverTypes = (row: RollListRow): ProcessingType[] =>
  row.stage === "done_shooting" ? ["develop_scan", "develop"] : ["scan"];

/** The job a picked roll starts with: develop only when the plan says so or scans at home. */
export const handOverType = (row: RollListRow): ProcessingType =>
  row.stage !== "done_shooting"
    ? "scan"
    : row.plan.target === "developed" || row.plan.scanBy === "self"
      ? "develop"
      : "develop_scan";
