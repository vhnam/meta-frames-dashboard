import { queryOptions } from "@tanstack/vue-query";
import { isAxiosError } from "axios";
import { http } from "#/shared/api/http";
import { toCamera } from "#/features/cameras/api";
import type { ApiCamera } from "#/features/cameras/api";
import { toStock } from "#/features/film-stocks/api";
import type { ApiStock } from "#/features/film-stocks/api";
import type { Process } from "#/features/film-stocks/types";
import { toLens } from "#/features/lenses/api";
import type { ApiLens } from "#/features/lenses/api";
import { expiryDate, isExpired } from "./format";
import type {
  AddRollsInput,
  ExpiryReport,
  RollDetail,
  RollFilters,
  RollRow,
  RollStatus,
  UpdateRollInput,
} from "./types";

/**
 * Domain-shaped query keys, from broad to narrow:
 *   ["rolls"]                     everything about rolls
 *   ["rolls", "list", {filters}]  one filtered list
 *   ["rolls", "detail", id]       one roll
 * Invalidating a prefix refreshes everything beneath it, so a write names the
 * narrowest prefix it can affect.
 */
export const rollKeys = {
  all: ["rolls"] as const,
  lists: () => [...rollKeys.all, "list"] as const,
  list: (filters: RollFilters) => [...rollKeys.lists(), filters] as const,
  details: () => [...rollKeys.all, "detail"] as const,
  detail: (id: string) => [...rollKeys.details(), id] as const,
  expiry: () => [...rollKeys.all, "expiry"] as const,
};

/** Meta-Frame API roll, as returned by `GET /rolls`. */
interface ApiRoll {
  id: string;
  filmStockId: string;
  stockName: string;
  stockBrand?: string;
  format: number | string;
  exposures: number;
  price?: number;
  expiry?: { year: number; month?: number };
  status: RollStatus;
  cameraId?: string;
  cameraName?: string;
  startedAt?: string;
  negativesAtLab: boolean;
}

interface ApiRollDetail {
  roll: ApiRoll;
  stock: ApiStock;
  lenses: ApiLens[];
  frames: {
    id: string;
    number: number;
    notes?: string;
    scanCount?: number;
    scans?: unknown[];
  }[];
  processing: {
    id: string;
    labName?: string;
    type?: string;
    process?: Process;
    sentDate?: string;
    sentAt?: string;
    price?: number;
    notes?: string;
    negativesReturnedDate?: string;
    negativesReturnedAt?: string;
  }[];
  totals: { total: number; incomplete: boolean };
}

function toApiRow(r: ApiRoll): RollRow {
  return {
    roll: {
      id: r.id,
      stockId: r.filmStockId,
      format: String(r.format),
      exposures: r.exposures,
      price: r.price ?? null,
      expiryYear: r.expiry?.year ?? null,
      expiryMonth: r.expiry?.month ?? null,
      status: r.status,
      cameraId: r.cameraId ?? null,
      // TODO: lenses, shot ISO, finish date and notes are not on the list endpoint
      lensIds: [],
      shotIso: null,
      startDate: r.startedAt ?? null,
      finishDate: null,
      description: "",
      createdAt: "",
    },
    stockName: [r.stockBrand, r.stockName].filter(Boolean).join(" "),
    boxIso: 0,
    cameraName: r.cameraName ?? null,
    negativesAtLab: r.negativesAtLab,
  };
}

export const rollQueries = {
  list: (filters: RollFilters) =>
    queryOptions({
      queryKey: rollKeys.list(filters),
      queryFn: async (): Promise<RollRow[]> => {
        const { data } = await http.get<ApiRoll[]>("/rolls", {
          params: {
            status: filters.status,
            filmStockId: filters.stockId,
            cameraId: filters.cameraId,
            lensId: filters.lensId,
            format: filters.format,
            startedFrom: filters.from,
            startedTo: filters.to,
          },
        });
        return data.map(toApiRow);
      },
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: rollKeys.detail(id),
      queryFn: async (): Promise<RollDetail | null> => {
        let data: ApiRollDetail;
        try {
          data = (await http.get<ApiRollDetail>(`/rolls/${id}`)).data;
        } catch (e) {
          if (isAxiosError(e) && e.response?.status === 404) return null;
          throw e;
        }
        const row = toApiRow(data.roll);
        const cameraId = data.roll.cameraId;
        const stock = toStock(data.stock);
        const [camera, linked, base] = await Promise.all([
          cameraId ? http.get<ApiCamera>(`/cameras/${cameraId}`) : undefined,
          cameraId ? http.get<ApiLens[]>(`/cameras/${cameraId}/lenses`) : undefined,
          stock.baseStockId
            ? http.get<{ baseStock?: ApiStock }>(`/film-stocks/${stock.id}`)
            : undefined,
        ]);
        const fixedLens = camera?.data.hasFixedLens ? cameraId : null;
        return {
          roll: { ...row.roll, lensIds: data.lenses.map((l) => l.id) },
          stock,
          base: base?.data.baseStock ? toStock(base.data.baseStock) : null,
          camera: camera ? toCamera(camera.data) : null,
          lenses: data.lenses.map((l) => toLens(l)),
          cameraLenses: (linked?.data ?? []).map((l) => toLens(l, fixedLens ?? null)),
          // TODO: job and frame field names are guesses; the spec for them was not available
          jobs: data.processing.map((j) => ({
            id: j.id,
            labName: j.labName ?? "Home",
            type: j.type ?? "",
            process: j.process ?? stock.process,
            sentDate: j.sentDate ?? j.sentAt ?? "",
            price: j.price ?? null,
            notes: j.notes ?? "",
            open: !(j.negativesReturnedDate ?? j.negativesReturnedAt),
          })),
          frames: data.frames.map((f) => ({
            frame: { id: f.id, rollId: id, number: f.number, notes: f.notes ?? "" },
            scanCount: f.scanCount ?? f.scans?.length ?? 0,
          })),
          cost: { total: data.totals.total, incomplete: data.totals.incomplete },
          negativesAtLab: data.roll.negativesAtLab,
        };
      },
    }),
  /** In-stock rolls expired or expiring within `months`, plus those with no expiry date. */
  expiry: (months = 6) =>
    queryOptions({
      queryKey: rollKeys.expiry(),
      queryFn: async (): Promise<ExpiryReport> => {
        const { data } = await http.get<ApiRoll[]>("/rolls", { params: { status: "in_stock" } });
        const rows = data.map(toApiRow);
        const horizon = new Date();
        horizon.setMonth(horizon.getMonth() + months);
        const dated = rows
          .flatMap((r) => {
            const d = expiryDate(r.roll);
            return d && d <= horizon ? [{ row: r, d }] : [];
          })
          .sort((a, b) => a.d.getTime() - b.d.getTime())
          .map(({ row }) => ({ ...row, expired: isExpired(row.roll) }));
        const undated = rows.filter((r) => !r.roll.expiryYear);
        return { dated, undated };
      },
    }),
};

/** The API reads a nested `expiry`; flat `expiryYear`/`expiryMonth` are silently ignored. */
const toApiExpiry = (i: { expiryYear?: number | null; expiryMonth?: number | null }) =>
  i.expiryYear ? { year: i.expiryYear, month: i.expiryMonth ?? undefined } : undefined;

export const addRolls = async (input: AddRollsInput) => {
  await http.post("/rolls/bulk", {
    filmStockId: input.stockId,
    format: Number(input.format),
    exposures: input.exposures,
    quantity: input.quantity,
    price: input.price ?? undefined,
    expiry: toApiExpiry(input),
  });
  return input.quantity;
};

export const updateRoll = async (v: { row: RollRow; input: UpdateRollInput }) => {
  const { row, input } = v;
  await http.put(`/rolls/${row.roll.id}`, {
    filmStockId: input.stockId,
    format: Number(input.format),
    exposures: input.exposures,
    price: input.price ?? undefined,
    expiry: toApiExpiry(input),
  });
};

export const deleteRoll = async (id: string) => {
  await http.delete(`/rolls/${id}`);
};
