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
  LoadRollInput,
  RollRow,
  SendToLabInput,
  ProcessingType,
  RollStatus,
  Scanner,
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
  shotIso?: number;
  description?: string;
  startedAt?: string;
  finishedAt?: string;
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
    labId?: string;
    labName?: string;
    type: ProcessingType;
    process: Process;
    sentAt: string;
    scansReceivedAt?: string;
    negativesReturnedAt?: string;
    price?: number;
    notes?: string;
    scanOrders?: { scanner: Scanner; hiRes: boolean; scanCount: number }[];
    isOpen: boolean;
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
      // TODO: lenses are not on the list endpoint
      lensIds: [],
      shotIso: r.shotIso ?? null,
      startDate: r.startedAt ?? null,
      finishDate: r.finishedAt ?? null,
      description: r.description ?? "",
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
          jobs: data.processing.map((j) => ({
            id: j.id,
            labId: j.labId ?? null,
            labName: j.labName ?? "Home",
            type: j.type,
            process: j.process,
            sentDate: j.sentAt,
            scansReceivedDate: j.scansReceivedAt ?? null,
            negativesReturnedDate: j.negativesReturnedAt ?? null,
            price: j.price ?? null,
            notes: j.notes ?? "",
            scanOrders: j.scanOrders ?? [],
            open: j.isOpen,
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

export const loadRoll = async (v: { id: string; input: LoadRollInput }) => {
  await http.put(`/rolls/${v.id}/load`, {
    cameraId: v.input.cameraId,
    startedAt: v.input.startedAt || undefined,
    shotIso: v.input.shotIso ?? undefined,
  });
    // the PUT replaces the roll: resend what this form does not edit so it is not cleared
    shotIso: row.roll.shotIso ?? undefined,
    startedAt: row.roll.startDate ?? undefined,
    finishedAt: row.roll.finishDate ?? undefined,
    description: row.roll.description || undefined,
};

/** The API upserts a processing job at a client-chosen id. */
const putJob = async (rollId: string, jobId: string, input: SendToLabInput) => {
  await http.put(`/rolls/${rollId}/processing/${jobId}`, {
    type: input.type,
    labId: input.labId || undefined,
    process: input.process,
    price: input.price ?? undefined,
    sentAt: input.sentAt || undefined,
    notes: input.notes || undefined,
    scanOrders: input.scanOrders,
  });
};

export const sendToLab = (v: { rollId: string; input: SendToLabInput }) =>
  putJob(v.rollId, crypto.randomUUID(), v.input);

/** A job's roll and type cannot change; the rest, scanners included, can. */
export const updateJob = (v: { rollId: string; jobId: string; input: SendToLabInput }) =>
  putJob(v.rollId, v.jobId, v.input);

/** Without a date the API records today. */
export const recordScansReceived = async (v: { rollId: string; jobId: string; date?: string }) => {
  await http.put(`/processing/${v.jobId}/scans-received`, { date: v.date || undefined });
};

export const recordNegativesReturned = async (v: {
  rollId: string;
  jobId: string;
  date?: string;
}) => {
  await http.put(`/processing/${v.jobId}/negatives-returned`, { date: v.date || undefined });
};

export const deleteJob = async (v: { rollId: string; jobId: string }) => {
  await http.delete(`/processing/${v.jobId}`);
};

export const finishRoll = async (id: string) => {
  await http.put(`/rolls/${id}/finish`, {});
};

export const setRollLenses = async (v: { id: string; lensIds: string[] }) => {
  await http.put(`/rolls/${v.id}/lenses`, { lensIds: v.lensIds });
};

export const deleteRoll = async (id: string) => {
  await http.delete(`/rolls/${id}`);
};
