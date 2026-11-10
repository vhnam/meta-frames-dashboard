import { PAGE_SIZES } from "#/shared/components/dataTable";

const KEY = "meta-frames:list-pages";

/** Page and page size carried on the URL. Defaults are left off. */
export interface ListSearch {
  page?: number;
  pageSize?: number;
}

export function parseListSearch(search: { page?: unknown; pageSize?: unknown }): ListSearch {
  const page = Number(search.page);
  const pageSize = Number(search.pageSize);
  const out: ListSearch = {};
  if (Number.isInteger(page) && page > 1) out.page = page;
  if ((PAGE_SIZES as readonly number[]).includes(pageSize) && pageSize !== PAGE_SIZES[0])
    out.pageSize = pageSize;
  return out;
}

/** Omit the default page (1) and page size so the URL stays clean. */
export function toListSearch(page: number, pageSize: number): ListSearch {
  const out: ListSearch = {};
  if (page > 1) out.page = page;
  if (pageSize !== PAGE_SIZES[0]) out.pageSize = pageSize;
  return out;
}

type StoredSearch = Record<string, unknown>;

function readAll(): Record<string, StoredSearch> {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredSearch>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Remember a listing's whole search (pager, tab, filters) so a later Back link can restore it.
 * The listing's route still validates it when Back navigates there.
 */
export function rememberList(path: string, search: StoredSearch) {
  if (typeof sessionStorage === "undefined") return;
  const all = readAll();
  all[path] = search;
  sessionStorage.setItem(KEY, JSON.stringify(all));
}

export function rememberedSearch(path: string): StoredSearch | null {
  const saved = readAll()[path];
  return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : null;
}
