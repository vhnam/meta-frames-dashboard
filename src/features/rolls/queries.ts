import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import { useApiMutation } from "#/shared/api/mutation";
import { cameraKeys } from "#/features/cameras";
import { stockKeys } from "#/features/film-stocks";
import { addRolls, deleteRoll, rollKeys, rollQueries, updateRoll } from "./api";
import type { RollFilters } from "./types";

export const useRollList = (filters: MaybeRefOrGetter<RollFilters>) =>
  useQuery(() => ({ ...rollQueries.list(toValue(filters)), placeholderData: keepPreviousData }));
export const useRollDetail = (id: MaybeRefOrGetter<string | undefined>) =>
  useQuery(() => ({ ...rollQueries.detail(toValue(id) ?? ""), enabled: !!toValue(id) }));
export const useExpiryReport = () => useQuery(rollQueries.expiry());

export const useAddRolls = () =>
  useApiMutation({
    fn: addRolls,
    // new in-stock rolls change lists, expiry and inventory
    invalidates: () => [rollKeys.lists(), rollKeys.expiry(), stockKeys.all],
    success: (_v, count) => `${count} roll${count === 1 ? "" : "s"} added`,
  });

export const useUpdateRoll = () =>
  useApiMutation({
    fn: updateRoll,
    invalidates: (v) => [
      rollKeys.detail(v.row.roll.id),
      rollKeys.lists(),
      rollKeys.expiry(),
      stockKeys.all,
      cameraKeys.lists(),
    ],
    success: "Roll updated",
  });

export const useDeleteRoll = () =>
  useApiMutation({
    fn: deleteRoll,
    invalidates: () => [rollKeys.all, stockKeys.all, cameraKeys.lists()],
    success: "Roll deleted",
  });
