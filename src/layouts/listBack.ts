import { isListingPath, listingPath } from "./nav";
import {
  parseListSearch,
  rememberedPage,
  toListSearch,
  type ListSearch,
} from "#/shared/lib/listSearch";

export interface ListBack {
  to: string;
  search: ListSearch;
}

/**
 * Where Back goes from a detail route: the parent listing, plus that listing's
 * page and page size when they are not the defaults.
 */
export function backToListing(
  pathname: string,
  search: { page?: unknown; pageSize?: unknown },
): ListBack | null {
  if (pathname === "/" || isListingPath(pathname)) return null;
  const to = listingPath(pathname);
  if (!to) return null;
  const current = parseListSearch(search);
  if (current.page != null || current.pageSize != null) return { to, search: current };
  const saved = rememberedPage(to);
  return { to, search: saved ? toListSearch(saved.page, saved.pageSize) : {} };
}
