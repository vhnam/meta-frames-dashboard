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
    scansExpectedAt?: string;
    negativesExpectedAt?: string;
    negativesReturnedAt?: string;
    price?: number;
    notes?: string;
    scanOrders?: { scanner: Scanner; hiRes: boolean; scanCount: number }[];
    isOpen: boolean;
  }[];
  totals: { total: number; incomplete: boolean };
}

function toApiRow(apiRoll: ApiRoll): RollRow {
  return {
    roll: {
      id: apiRoll.id,
      stockId: apiRoll.filmStockId,
      format: String(apiRoll.format),
      exposures: apiRoll.exposures,
      price: apiRoll.price ?? null,
      expiryYear: apiRoll.expiry?.year ?? null,
      expiryMonth: apiRoll.expiry?.month ?? null,
      status: apiRoll.status,
      cameraId: apiRoll.cameraId ?? null,
      // TODO: lenses are not on the list endpoint
      lensIds: [],
      shotIso: apiRoll.shotIso ?? null,
      startDate: apiRoll.startedAt ?? null,
      finishDate: apiRoll.finishedAt ?? null,
      description: apiRoll.description ?? "",
      createdAt: "",
    },
    stockName: [apiRoll.stockBrand, apiRoll.stockName].filter(Boolean).join(" "),
    boxIso: 0,
    cameraName: apiRoll.cameraName ?? null,
    negativesAtLab: apiRoll.negativesAtLab,
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
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) return null;
          throw error;
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
          roll: { ...row.roll, lensIds: data.lenses.map((lens) => lens.id) },
          stock,
          base: base?.data.baseStock ? toStock(base.data.baseStock) : null,
          camera: camera ? toCamera(camera.data) : null,
          lenses: data.lenses.map((lens) => toLens(lens)),
          cameraLenses: (linked?.data ?? []).map((lens) => toLens(lens, fixedLens ?? null)),
          jobs: data.processing.map((job) => ({
            id: job.id,
            labId: job.labId ?? null,
            labName: job.labName ?? "Home",
            type: job.type,
            process: job.process,
            sentDate: job.sentAt,
            scansExpectedDate: job.scansExpectedAt ?? null,
            negativesExpectedDate: job.negativesExpectedAt ?? null,
            scansReceivedDate: job.scansReceivedAt ?? null,
            negativesReturnedDate: job.negativesReturnedAt ?? null,
            price: job.price ?? null,
            notes: job.notes ?? "",
            scanOrders: job.scanOrders ?? [],
            open: job.isOpen,
          })),
          frames: data.frames.map((frame) => ({
            frame: { id: frame.id, rollId: id, number: frame.number, notes: frame.notes ?? "" },
            scanCount: frame.scanCount ?? frame.scans?.length ?? 0,
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
          .flatMap((row) => {
            const date = expiryDate(row.roll);
            return date && date <= horizon ? [{ row: row, d: date }] : [];
          })
          .sort((left, right) => left.d.getTime() - right.d.getTime())
          .map(({ row }) => ({ ...row, expired: isExpired(row.roll) }));
        const undated = rows.filter((row) => !row.roll.expiryYear);
        return { dated, undated };
      },
    }),
};

/** The API reads a nested `expiry`; flat `expiryYear`/`expiryMonth` are silently ignored. */
const toApiExpiry = (input: { expiryYear?: number | null; expiryMonth?: number | null }) =>
  input.expiryYear ? { year: input.expiryYear, month: input.expiryMonth ?? undefined } : undefined;

export const addRolls = async (input: AddRollsInput) => {
  await http.post(
    "/rolls/bulk",
    {
      filmStockId: input.stockId,
      format: Number(input.format),
      exposures: input.exposures,
      quantity: input.quantity,
      price: input.price ?? undefined,
      expiry: toApiExpiry(input),
    },
    // one key per submit: a retry of the same request must not add the rolls twice
    { headers: { "Idempotency-Key": crypto.randomUUID() } },
  );
  return input.quantity;
};

export const updateRoll = async (variables: { row: RollRow; input: UpdateRollInput }) => {
  const { row, input } = variables;
  await http.put(`/rolls/${row.roll.id}`, {
    filmStockId: input.stockId,
    format: Number(input.format),
    exposures: input.exposures,
    price: input.price ?? undefined,
    expiry: toApiExpiry(input),
    // the PUT replaces the roll: resend what this form does not edit so it is not cleared
    shotIso: row.roll.shotIso ?? undefined,
    startedAt: row.roll.startDate ?? undefined,
    finishedAt: row.roll.finishDate ?? undefined,
    description: row.roll.description || undefined,
  });
};

export const loadRoll = async (variables: { id: string; input: LoadRollInput }) => {
  await http.put(`/rolls/${variables.id}/load`, {
    cameraId: variables.input.cameraId,
    startedAt: variables.input.startedAt || undefined,
    shotIso: variables.input.shotIso ?? undefined,
  });
};

/** The API upserts a processing job at a client-chosen id. */
const putJob = async (rollId: string, jobId: string, input: SendToLabInput) => {
  await http.put(`/rolls/${rollId}/processing/${jobId}`, {
    type: input.type,
    labId: input.labId || undefined,
    process: input.process,
    price: input.price ?? undefined,
    sentAt: input.sentAt || undefined,
    scansExpectedAt: input.scansExpectedAt || undefined,
    negativesExpectedAt: input.negativesExpectedAt || undefined,
    notes: input.notes || undefined,
    scanOrders: input.scanOrders,
  });
};

/**
 * Work done at home is finished when it is recorded, so its receipt dates are sent with it: the
 * API has its own endpoints for them.
 */
export const sendToLab = async (variables: {
  rollId: string;
  input: SendToLabInput;
  received?: { scansAt?: string; negativesAt?: string };
}) => {
  const jobId = crypto.randomUUID();
  await putJob(variables.rollId, jobId, variables.input);
  if (variables.received?.scansAt)
    await recordScansReceived({
      rollId: variables.rollId,
      jobId,
      date: variables.received.scansAt,
    });
  if (variables.received?.negativesAt)
    await recordNegativesReturned({
      rollId: variables.rollId,
      jobId,
      date: variables.received.negativesAt,
    });
};

/** A job's roll cannot change; the dialog keeps its lab fixed too. */
export const updateJob = (variables: { rollId: string; jobId: string; input: SendToLabInput }) =>
  putJob(variables.rollId, variables.jobId, variables.input);

/** Without a date the API records today. */
export const recordScansReceived = async (variables: {
  rollId: string;
  jobId: string;
  date?: string;
}) => {
  await http.put(`/processing/${variables.jobId}/scans-received`, {
    date: variables.date || undefined,
  });
};

export const recordNegativesReturned = async (variables: {
  rollId: string;
  jobId: string;
  date?: string;
}) => {
  await http.put(`/processing/${variables.jobId}/negatives-returned`, {
    date: variables.date || undefined,
  });
};

export const deleteJob = async (variables: { rollId: string; jobId: string }) => {
  await http.delete(`/processing/${variables.jobId}`);
};

export const finishRoll = async (id: string) => {
  await http.put(`/rolls/${id}/finish`, {});
};

export const setRollLenses = async (variables: { id: string; lensIds: string[] }) => {
  await http.put(`/rolls/${variables.id}/lenses`, { lensIds: variables.lensIds });
};

export const deleteRoll = async (id: string) => {
  await http.delete(`/rolls/${id}`);
};
