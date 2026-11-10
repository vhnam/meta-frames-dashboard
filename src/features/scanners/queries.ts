import { useQuery } from "@tanstack/vue-query";
import { useApiMutation } from "#/shared/api/mutation";
import { labKeys } from "#/features/labs";
import { rollKeys } from "#/features/rolls";
import { scanKeys } from "#/features/scans/api";
import { deleteScanner, saveScanner, scannerKeys, scannerQueries } from "./api";

export const useScannerList = () => useQuery(scannerQueries.list());

export const useScannerKinds = () => useQuery(scannerQueries.kinds());

export const useSaveScanner = () =>
  useApiMutation({
    fn: saveScanner,
    // scanner names appear on the scan orders of roll histories and in Compare
    invalidates: (variables) =>
      variables.id ? [scannerKeys.all, rollKeys.details(), scanKeys.all] : [scannerKeys.all],
    success: "Scanner saved",
  });

export const useDeleteScanner = () =>
  useApiMutation({
    fn: deleteScanner,
    // the server unlinks the scanner from every lab
    invalidates: () => [scannerKeys.all, labKeys.all],
    success: "Scanner deleted",
  });
