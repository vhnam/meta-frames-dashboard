import { useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import { computed } from "vue";
import { useApiMutation } from "#/shared/api/mutation";
import { rollKeys } from "#/features/rolls";
import { deleteLabOrder, labOrderKeys, labOrderQueries, saveLabOrder, setJobLines } from "./api";

export const useLabOrderList = () => useQuery(labOrderQueries.list());

export const useLabOrderDetail = (id: MaybeRefOrGetter<string>) =>
  useQuery(computed(() => labOrderQueries.detail(toValue(id))));

export const useLinkableJobs = (id: MaybeRefOrGetter<string>, enabled: MaybeRefOrGetter<boolean>) =>
  useQuery(
    computed(() => ({ ...labOrderQueries.linkableJobs(toValue(id)), enabled: toValue(enabled) })),
  );

export const useSaveLabOrder = () =>
  useApiMutation({
    fn: saveLabOrder,
    // the order's VAT and lines set the price of the rolls on it
    invalidates: () => [labOrderKeys.all, rollKeys.details()],
    success: "Order saved",
  });

export const useDeleteLabOrder = () =>
  useApiMutation({
    fn: deleteLabOrder,
    invalidates: () => [labOrderKeys.all],
    success: "Order deleted",
  });

export const useSetJobLines = () =>
  useApiMutation({
    fn: setJobLines,
    invalidates: () => [labOrderKeys.all, rollKeys.details()],
    success: ({ lineIds }) =>
      lineIds.length ? "Roll's order lines saved" : "Roll taken off the order",
  });
