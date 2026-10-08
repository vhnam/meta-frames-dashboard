import {
  columnFacetingFeature,
  columnFilteringFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from "@tanstack/vue-table";

/** Per-column extras: `filter` turns the column into a dropdown (TanStack column filter). */
export interface DataTableColumnMeta {
  filter?: {
    label: string;
    /** Text of the empty ("no filter") option. */
    placeholder: string;
    format?: (value: string) => string;
    /** Fixed choices, listed even when no row has them; otherwise the column's values are used. */
    options?: readonly string[];
  };
  /** Width and overflow classes applied to the header and body cells. */
  class?: string;
  /** Right-align the header and cells (for example an actions column). */
  align?: "right";
}

export const PAGE_SIZES = [10, 20, 50] as const;

export const dataTableFeatures = tableFeatures({
  columnMeta: {} as DataTableColumnMeta,
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
});

export type DataTableFeatures = typeof dataTableFeatures;
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatures, TData>;
