import { queryOptions } from "@tanstack/vue-query";
import { http } from "#/shared/api/http";
import { previewBody, buildImportForm } from "./importForm";
import type { ImportEntry } from "./importForm";
import type {
  FrameComparison,
  ImportPreviewItem,
  ImportResult,
  NumberingMode,
  OnConflict,
  Scan,
} from "./types";

/** Scans hang under a processing job: `["scans", jobId, ...]`. */
export const scanKeys = {
  all: ["scans"] as const,
  job: (jobId: string) => [...scanKeys.all, jobId] as const,
  compare: (jobId: string, frameNumber: number) =>
    [...scanKeys.job(jobId), "compare", frameNumber] as const,
  file: (scanId: string) => [...scanKeys.all, "file", scanId] as const,
};

interface ApiScan extends Scan {
  frameId: string;
  scanner: string;
  fileUrl: string;
}

const toScan = (scan: ApiScan): Scan => ({
  id: scan.id,
  processingId: scan.processingId,
  frameNumber: scan.frameNumber,
  scannerId: scan.scannerId,
  scannerName: scan.scannerName,
  fileName: scan.fileName,
  sizeBytes: scan.sizeBytes,
});

export const scanQueries = {
  compare: (jobId: string, frameNumber: number) =>
    queryOptions({
      queryKey: scanKeys.compare(jobId, frameNumber),
      queryFn: async (): Promise<FrameComparison> => {
        const { data } = await http.get<Omit<FrameComparison, "scans"> & { scans: ApiScan[] }>(
          `/processing/${jobId}/frames/${frameNumber}/compare`,
        );
        return {
          frameNumber: data.frameNumber,
          scans: data.scans.map(toScan),
          previousFrameNumber: data.previousFrameNumber ?? null,
          nextFrameNumber: data.nextFrameNumber ?? null,
        };
      },
    }),
  /** The full-size image, fetched with the session cookie (an `<img>` cannot send it cross-origin). */
  file: (scanId: string) =>
    queryOptions({
      queryKey: scanKeys.file(scanId),
      // `v` defeats the browser HTTP cache (the server sends max-age=3600 and a replaced scan keeps its id)
      queryFn: async (): Promise<Blob> =>
        (
          await http.get<Blob>(`/scans/${scanId}/file`, {
            responseType: "blob",
            params: { v: Date.now() },
          })
        ).data,
      staleTime: Infinity,
    }),
};

export const previewImport = async (variables: {
  jobId: string;
  fileNames: readonly string[];
  mode: NumberingMode;
  startFrame: number;
  offset: number;
}): Promise<ImportPreviewItem[]> =>
  (
    await http.post<ImportPreviewItem[]>(
      `/processing/${variables.jobId}/scans/preview`,
      previewBody(variables.fileNames, variables.mode, variables.startFrame, variables.offset),
    )
  ).data;

export const importScans = async (variables: {
  jobId: string;
  scannerId: string;
  onConflict: OnConflict;
  entries: readonly ImportEntry[];
}): Promise<ImportResult> => {
  const { data } = await http.post<Omit<ImportResult, "imported"> & { imported: ApiScan[] }>(
    `/processing/${variables.jobId}/scans`,
    buildImportForm(variables.scannerId, variables.onConflict, variables.entries),
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return { ...data, imported: data.imported.map(toScan) };
};
