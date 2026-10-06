import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import { useApiMutation } from "#/shared/api/mutation";
import { rollKeys } from "#/features/rolls";
import { deleteStock, saveStock, stockKeys, stockQueries } from "./api";
import type { InventoryFilters } from "./types";

export const useStockList = () => useQuery(stockQueries.list());
export const useStockDetail = (id: MaybeRefOrGetter<string>) =>
  useQuery(() => stockQueries.detail(toValue(id)));
export const useInventory = (filters: MaybeRefOrGetter<InventoryFilters>) =>
  useQuery(() => ({
    ...stockQueries.inventory(toValue(filters)),
    placeholderData: keepPreviousData,
  }));

export const useSaveStock = () =>
  useApiMutation({
    fn: saveStock,
    // roll rows and details embed the stock name
    invalidates: (v) => (v.id ? [stockKeys.all, rollKeys.all] : [stockKeys.all]),
    success: (v) => (v.id ? "Stock updated" : "Stock added"),
  });

export const useDeleteStock = () =>
  useApiMutation({
    fn: deleteStock,
    invalidates: () => [stockKeys.all],
    success: "Stock deleted",
  });
