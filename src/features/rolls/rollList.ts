import { FILM_TYPE_LABELS, type FilmStock } from "#/features/film-stocks/types";
import { byExpiry, expiryState, formatExpiry } from "./format";
import { FORMATS, ROLL_STATUSES, isRollComplete } from "./types";
import type { Roll, RollRow, RollStatus } from "./types";

/** In-stock expiry filter; `alert` is "expired or expiring soon", as the alerts bell counts. */
export const EXPIRY_FILTERS = ["expired", "soon", "alert", "undated"] as const;
export type ExpiryFilter = (typeof EXPIRY_FILTERS)[number];

/** Rolls page state carried on the URL. Defaults are left off. */
export interface RollListSearch {
  tab?: RollStatus;
  /** "All" tab: only complete rolls. */
  complete?: true;
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
  const tab = ROLL_STATUSES.find((status) => status === search.tab);
  const out: RollListSearch = {};
  if (tab) out.tab = tab;
  if (!tab && (search.complete === true || search.complete === "true")) out.complete = true;
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

/** Rows shown in a tab, before the table's own search and column filters. */
export function rollsInView(rows: RollRow[], search: RollListSearch, now?: Date): RollRow[] {
  if (!search.tab)
    return search.complete
      ? rows.filter((row) => isRollComplete(row.roll.status, row.negativesAtLab))
      : rows;
  const inTab = rows.filter((row) => row.roll.status === search.tab);
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
