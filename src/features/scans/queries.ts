import { useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import { useApiMutation } from "#/shared/api/mutation";
import { rollKeys } from "#/features/rolls";
import { importScans, previewImport, scanKeys, scanQueries } from "./api";

export const useFrameComparison = (
  jobId: MaybeRefOrGetter<string>,
  frameNumber: MaybeRefOrGetter<number | undefined>,
) =>
  useQuery(() => {
    const frame = toValue(frameNumber);
    return {
      ...scanQueries.compare(toValue(jobId), frame ?? 0),
      enabled: frame !== undefined,
      retry: false,
    };
  });

export const useScanFile = (scanId: MaybeRefOrGetter<string>) =>
  useQuery(() => scanQueries.file(toValue(scanId)));

/** Reads nothing back into the cache: a preview changes no data. */
export const usePreviewImport = () => useApiMutation({ fn: previewImport, invalidates: () => [] });

export const useImportScans = () =>
  useApiMutation({
    fn: importScans,
    // frame scan counts, the job's received date and its status move with an import; a replace
    // keeps the scan id, so every cached image (scanKeys.file) goes stale too
    invalidates: () => [scanKeys.all, rollKeys.all],
    success: (_variables, result) =>
      `${result.imported.length} scan${result.imported.length === 1 ? "" : "s"} imported`,
  });
