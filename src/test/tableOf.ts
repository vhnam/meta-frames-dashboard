import type { VueWrapper } from "@vue/test-utils";
import type { Table } from "@tanstack/vue-table";
import type { DataTableFeatures } from "#/shared/components/dataTable";

/** The TanStack table that `DataTable` exposes, for driving filters in tests. */
export const tableOf = (wrapper: Pick<VueWrapper, "vm">) =>
  (wrapper.vm as unknown as { table: Table<DataTableFeatures, never> }).table;
