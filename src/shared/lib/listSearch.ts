import { PAGE_SIZES } from "#/shared/components/dataTable";

const KEY = "meta-frames:list-pages";

/** Page and page size carried on the URL. Defaults are left off. */
export interface ListSearch {
  page?: number;
  pageSize?: number;
}

interface StoredPage {
  page: number;
  pageSize: number;
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

function readAll(): Record<string, StoredPage> {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredPage>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Remember a listing's pager so a later Back link can restore it. */
export function rememberList(path: string, page: number, pageSize: number) {
  if (typeof sessionStorage === "undefined") return;
  const all = readAll();
  all[path] = { page, pageSize };
  sessionStorage.setItem(KEY, JSON.stringify(all));
}

export function rememberedPage(path: string): StoredPage | null {
  const saved = readAll()[path];
  if (!saved || !Number.isInteger(saved.page) || saved.page < 1) return null;
  if (!(PAGE_SIZES as readonly number[]).includes(saved.pageSize)) return null;
  return saved;
}
