import { useQuery } from "@tanstack/vue-query";
import { useApiMutation } from "#/shared/api/mutation";
import { rollKeys } from "#/features/rolls";
import { deleteScanner, saveScanner, scannerKeys, scannerQueries } from "./api";

export const useScannerList = () => useQuery(scannerQueries.list());

export const useScannerKinds = () => useQuery(scannerQueries.kinds());

export const useSaveScanner = () =>
  useApiMutation({
    fn: saveScanner,
    // scanner names appear on the scan orders of roll histories
    invalidates: (variables) =>
      variables.id ? [scannerKeys.all, rollKeys.details()] : [scannerKeys.all],
    success: "Scanner saved",
  });

export const useDeleteScanner = () =>
  useApiMutation({
    fn: deleteScanner,
    invalidates: () => [scannerKeys.all],
    success: "Scanner deleted",
  });
