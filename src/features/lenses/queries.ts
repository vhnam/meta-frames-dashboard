import { useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import { patchQueries, useApiMutation } from "#/shared/api/mutation";
import { cameraKeys } from "#/features/cameras";
import { deleteLens, lensKeys, lensQueries, saveLens, setLensActive } from "./api";
import type { LensRow } from "./types";

export const useLensList = () => useQuery(lensQueries.list());

/** One lens, read from the list cache; null when it does not exist. */
export const useLensDetail = (id: MaybeRefOrGetter<string>) =>
  useQuery(() => ({
    ...lensQueries.list(),
    select: (rows: LensRow[]) => rows.find((row) => row.lens.id === toValue(id)) ?? null,
  }));

export const useSaveLens = () =>
  useApiMutation({
    fn: saveLens,
    // linked-lens lists on camera pages show lens names
    invalidates: () => [lensKeys.all, cameraKeys.details()],
    success: (variables) => (variables.id ? "Lens updated" : "Lens added"),
  });

export const useSetLensActive = () =>
  useApiMutation({
    fn: setLensActive,
    optimistic: {
      cancel: () => [lensKeys.lists()],
      apply: (qc, variables) =>
        patchQueries<LensRow[]>(qc, { queryKey: lensKeys.lists() }, (rows) =>
          rows.map((row) =>
            row.lens.id === variables.id
              ? { ...row, lens: { ...row.lens, active: variables.active } }
              : row,
          ),
        ),
    },
    invalidates: () => [lensKeys.lists()],
  });

export const useDeleteLens = () =>
  useApiMutation({
    fn: deleteLens,
    invalidates: () => [lensKeys.all, cameraKeys.details()],
    success: "Lens deleted",
  });
