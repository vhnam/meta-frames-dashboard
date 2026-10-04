/**
 * Domain-shaped query keys, from broad to narrow:
 *   ["rolls"]                     everything about rolls
 *   ["rolls", "list", {filters}]  one filtered list
 *   ["rolls", "detail", id]       one roll
 * Invalidating a prefix refreshes everything beneath it, so a write names the
 * narrowest prefix it can affect.
 */
export interface RollFilters {
  stockId?: string;
  cameraId?: string;
  lensId?: string;
  format?: string;
  status?: string;
  from?: string;
  to?: string;
}
export interface InventoryFilters {
  type?: string;
  process?: string;
  iso?: number;
}

export const cameraKeys = {
  all: ["cameras"] as const,
  lists: () => [...cameraKeys.all, "list"] as const,
  list: (filters: { includeInactive: boolean }) => [...cameraKeys.lists(), filters] as const,
  details: () => [...cameraKeys.all, "detail"] as const,
  detail: (id: string) => [...cameraKeys.details(), id] as const,
};

export const lensKeys = {
  all: ["lenses"] as const,
  lists: () => [...lensKeys.all, "list"] as const,
  list: () => [...lensKeys.lists()] as const,
};

export const stockKeys = {
  all: ["stocks"] as const,
  lists: () => [...stockKeys.all, "list"] as const,
  list: () => [...stockKeys.lists()] as const,
  details: () => [...stockKeys.all, "detail"] as const,
  detail: (id: string) => [...stockKeys.details(), id] as const,
  inventory: (filters: InventoryFilters) => [...stockKeys.all, "inventory", filters] as const,
};

export const rollKeys = {
  all: ["rolls"] as const,
  lists: () => [...rollKeys.all, "list"] as const,
  list: (filters: RollFilters) => [...rollKeys.lists(), filters] as const,
  details: () => [...rollKeys.all, "detail"] as const,
  detail: (id: string) => [...rollKeys.details(), id] as const,
  expiry: () => [...rollKeys.all, "expiry"] as const,
};

export const labKeys = {
  all: ["labs"] as const,
  lists: () => [...labKeys.all, "list"] as const,
  list: () => [...labKeys.lists()] as const,
};
