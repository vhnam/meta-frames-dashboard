import { useQuery } from "@tanstack/vue-query";
import { useApiMutation } from "#/shared/api/mutation";
import { rollKeys } from "#/features/rolls";
import { deleteLab, labKeys, labQueries, saveLab } from "./api";

export const useLabList = () => useQuery(labQueries.list());

export const useSaveLab = () =>
  useApiMutation({
    fn: saveLab,
    // lab names appear on jobs and roll histories
    invalidates: (v) => (v.id ? [labKeys.all, rollKeys.details()] : [labKeys.all]),
    success: "Lab saved",
  });

export const useDeleteLab = () =>
  useApiMutation({
    fn: deleteLab,
    invalidates: () => [labKeys.all],
    success: "Lab deleted",
  });
