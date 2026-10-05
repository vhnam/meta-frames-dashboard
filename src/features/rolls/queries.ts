import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import { useApiMutation } from "#/shared/api/mutation";
import { cameraKeys } from "#/features/cameras";
import { labKeys } from "#/features/labs";
import { stockKeys } from "#/features/film-stocks";
import {
  addRolls,
  deleteJob,
  deleteRoll,
  finishRoll,
  loadRoll,
  recordNegativesReturned,
  recordScansReceived,
  rollKeys,
  rollQueries,
  sendToLab,
  setRollLenses,
  updateJob,
  updateRoll,
} from "./api";
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

export const useLoadRoll = () =>
  useApiMutation({
    fn: loadRoll,
    invalidates: (v) => [
      rollKeys.detail(v.id),
      rollKeys.lists(),
      rollKeys.expiry(),
      stockKeys.all,
      cameraKeys.all,
    ],
    success: "Roll loaded into camera",
  });

export const useSendToLab = () =>
  useApiMutation({
    fn: sendToLab,
    invalidates: (v) => [
      rollKeys.detail(v.rollId),
      rollKeys.lists(),
      rollKeys.expiry(),
      labKeys.all,
    ],
    success: "Roll sent to lab",
  });

/** A job change moves the roll status and the lab's in-progress list. */
const jobInvalidates = (v: { rollId: string }) => [
  rollKeys.detail(v.rollId),
  rollKeys.lists(),
  rollKeys.expiry(),
  labKeys.all,
];

export const useUpdateJob = () =>
  useApiMutation({ fn: updateJob, invalidates: jobInvalidates, success: "Processing job updated" });

export const useRecordScansReceived = () =>
  useApiMutation({
    fn: recordScansReceived,
    invalidates: jobInvalidates,
    success: "Scans marked as received",
  });

export const useRecordNegativesReturned = () =>
  useApiMutation({
    fn: recordNegativesReturned,
    invalidates: jobInvalidates,
    success: "Negatives marked as returned",
  });

export const useDeleteJob = () =>
  useApiMutation({ fn: deleteJob, invalidates: jobInvalidates, success: "Processing job deleted" });

export const useFinishRoll = () =>
  useApiMutation({
    fn: finishRoll,
    invalidates: (id) => [rollKeys.detail(id), rollKeys.lists(), stockKeys.all, cameraKeys.all],
    success: "Roll marked as finished",
  });

export const useSetRollLenses = () =>
  useApiMutation({
    fn: setRollLenses,
    invalidates: (v) => [rollKeys.detail(v.id)],
    success: "Lenses updated",
  });

export const useDeleteRoll = () =>
  useApiMutation({
    fn: deleteRoll,
    invalidates: () => [rollKeys.all, stockKeys.all, cameraKeys.lists()],
    success: "Roll deleted",
  });
