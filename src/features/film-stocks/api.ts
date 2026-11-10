import { queryOptions } from "@tanstack/vue-query";
import { isAxiosError } from "axios";
import { http } from "#/shared/api/http";
import { stockName } from "./format";
import type { FilmStock, StockDetail, StockInput, StockRow } from "./types";

export const stockKeys = {
  all: ["stocks"] as const,
  lists: () => [...stockKeys.all, "list"] as const,
  list: () => [...stockKeys.lists()] as const,
  details: () => [...stockKeys.all, "detail"] as const,
  detail: (id: string) => [...stockKeys.details(), id] as const,
};

// ---- wire format (Meta-Frame API) ----

export interface ApiStock {
  id: string;
  brand: string;
  name: string;
  type: FilmStock["type"];
  boxIso: string;
  process: FilmStock["process"];
  packaging: FilmStock["packaging"];
  stockOrigin?: string;
  packOrigin?: string;
  description?: string;
  baseStockId?: string;
}

export interface ApiStockDetail {
  stock: ApiStock;
  baseStock?: ApiStock;
  siblings: ApiStock[];
  derived: ApiStock[];
}

export const toStock = (apiStock: ApiStock): FilmStock => ({
  id: apiStock.id,
  brand: apiStock.brand,
  name: apiStock.name,
  type: apiStock.type,
  boxIso: apiStock.boxIso,
  process: apiStock.process,
  packaging: apiStock.packaging,
  stockOrigin: apiStock.stockOrigin ?? "",
  packOrigin: apiStock.packOrigin ?? "",
  description: apiStock.description ?? "",
  baseStockId: apiStock.baseStockId ?? null,
});

const toApiInput = (input: StockInput) => ({
  brand: input.brand.trim(),
  name: input.name.trim(),
  type: input.type,
  boxIso: input.boxIso,
  process: input.process,
  packaging: input.packaging,
  stockOrigin: input.stockOrigin.trim() || undefined,
  packOrigin: input.packOrigin.trim() || undefined,
  description: input.description.trim() || undefined,
  baseStockId: input.baseStockId || undefined,
});

export const stockQueries = {
  list: () =>
    queryOptions({
      queryKey: stockKeys.list(),
      queryFn: async (): Promise<StockRow[]> => {
        const { data } = await http.get<ApiStock[]>("/film-stocks");
        const stocks = data.map(toStock);
        const byId = new Map(stocks.map((stock) => [stock.id, stock]));
        return stocks
          .map((stock) => ({
            stock,
            baseName: stock.baseStockId ? stockName(byId.get(stock.baseStockId)) : null,
          }))
          .sort((left, right) => stockName(left.stock).localeCompare(stockName(right.stock)));
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
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) return null;
          throw error;
        }
      },
    }),
};

export const saveStock = async (variables: { id?: string; input: StockInput }) => {
  const body = toApiInput(variables.input);
  if (variables.id) {
    await http.put(`/film-stocks/${variables.id}`, body);
    return variables.id;
  }
  return (await http.post<ApiStockDetail>("/film-stocks", body)).data.stock.id;
};

export const deleteStock = async (id: string) => {
  await http.delete(`/film-stocks/${id}`);
};
