import { keepPreviousData, queryOptions, useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import { isAxiosError } from "axios";
import type { StockInput } from "#/domain/inputs";
import { formatExpiry, stockName } from "#/domain/format";
import type { FilmStock } from "#/domain/types";
import { http } from "./http";
import { rollKeys, stockKeys } from "./keys";
import type { InventoryFilters } from "./keys";
import { useApiMutation } from "./mutation";

// ---- wire format (Meta-Frame API) ----

export interface ApiStock {
  id: string;
  brand: string;
  name: string;
  type: FilmStock["type"];
  boxIso: number;
  process: FilmStock["process"];
  packaging: FilmStock["packaging"];
  stockOrigin?: string;
  packOrigin?: string;
  description?: string;
  baseStockId?: string;
}

interface ApiStockDetail {
  stock: ApiStock;
  baseStock?: ApiStock;
  siblings: ApiStock[];
  derived: ApiStock[];
}

interface ApiInventoryItem {
  stock: ApiStock;
  formats: { format: number | string; count: number }[];
  soonestExpiry?: { year: number; month?: number };
}

export const toStock = (s: ApiStock): FilmStock => ({
  id: s.id,
  brand: s.brand,
  name: s.name,
  type: s.type,
  boxIso: s.boxIso,
  process: s.process,
  packaging: s.packaging,
  stockOrigin: s.stockOrigin ?? "",
  packOrigin: s.packOrigin ?? "",
  description: s.description ?? "",
  baseStockId: s.baseStockId ?? null,
});

const toApiInput = (i: StockInput) => ({
  brand: i.brand.trim(),
  name: i.name.trim(),
  type: i.type,
  boxIso: i.boxIso,
  process: i.process,
  packaging: i.packaging,
  stockOrigin: i.stockOrigin.trim() || undefined,
  packOrigin: i.packOrigin.trim() || undefined,
  description: i.description.trim() || undefined,
  baseStockId: i.baseStockId || undefined,
});

export interface StockRow {
  stock: FilmStock;
  baseName: string | null;
}
export interface StockDetail {
  stock: FilmStock;
  base: FilmStock | null;
  siblings: FilmStock[];
  children: FilmStock[];
}
export interface InventoryRow {
  stock: FilmStock;
  byFormat: Record<string, number>;
  expiryLabel: string;
}

export const stockQueries = {
  list: () =>
    queryOptions({
      queryKey: stockKeys.list(),
      queryFn: async (): Promise<StockRow[]> => {
        const { data } = await http.get<ApiStock[]>("/film-stocks");
        const stocks = data.map(toStock);
        const byId = new Map(stocks.map((s) => [s.id, s]));
        return stocks
          .map((stock) => ({
            stock,
            baseName: stock.baseStockId ? stockName(byId.get(stock.baseStockId)) : null,
          }))
          .sort((a, b) => stockName(a.stock).localeCompare(stockName(b.stock)));
      },
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: stockKeys.detail(id),
      queryFn: async (): Promise<StockDetail | null> => {
        try {
          const { data } = await http.get<ApiStockDetail>(`/film-stocks/${id}`);
          return {
            stock: toStock(data.stock),
            base: data.baseStock ? toStock(data.baseStock) : null,
            siblings: data.siblings.map(toStock),
            children: data.derived.map(toStock),
          };
        } catch (e) {
          if (isAxiosError(e) && e.response?.status === 404) return null;
          throw e;
        }
      },
    }),
  inventory: (filters: InventoryFilters) =>
    queryOptions({
      queryKey: stockKeys.inventory(filters),
      queryFn: async (): Promise<InventoryRow[]> => {
        const { data } = await http.get<ApiInventoryItem[]>("/inventory", { params: filters });
        return data
          .map((item) => ({
            stock: toStock(item.stock),
            byFormat: Object.fromEntries(item.formats.map((f) => [String(f.format), f.count])),
            expiryLabel: item.soonestExpiry
              ? formatExpiry({
                  expiryYear: item.soonestExpiry.year,
                  expiryMonth: item.soonestExpiry.month ?? null,
                })
              : "—",
          }))
          .sort((a, b) => stockName(a.stock).localeCompare(stockName(b.stock)));
      },
    }),
};

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
    fn: async (v: { id?: string; input: StockInput }) => {
      const body = toApiInput(v.input);
      if (v.id) {
        await http.put(`/film-stocks/${v.id}`, body);
        return v.id;
      }
      return (await http.post<ApiStockDetail>("/film-stocks", body)).data.stock.id;
    },
    // roll rows and details embed the stock name
    invalidates: (v) => (v.id ? [stockKeys.all, rollKeys.all] : [stockKeys.all]),
    success: (v) => (v.id ? "Stock updated" : "Stock added"),
  });

export const useDeleteStock = () =>
  useApiMutation({
    fn: async (id: string) => {
      await http.delete(`/film-stocks/${id}`);
    },
    invalidates: () => [stockKeys.all],
    success: "Stock deleted",
  });
