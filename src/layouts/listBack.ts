import { isListingPath, listingPath } from "./nav";
import { parseListSearch, rememberedSearch } from "#/shared/lib/listSearch";

export interface ListBack {
  to: string;
  search: Record<string, unknown>;
}

/**
 * Where Back goes from a detail route: the parent listing with the search it had when it was
 * left (tab, filters, page), or the page and page size the detail URL carries.
 */
export function backToListing(
  pathname: string,
  search: { page?: unknown; pageSize?: unknown },
): ListBack | null {
  if (pathname === "/" || isListingPath(pathname)) return null;
  const to = listingPath(pathname);
  if (!to) return null;
  const current = parseListSearch(search);
  if (current.page != null || current.pageSize != null) return { to, search: { ...current } };
  return { to, search: rememberedSearch(to) ?? {} };
}
