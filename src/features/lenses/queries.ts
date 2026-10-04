import { useQuery } from "@tanstack/vue-query";
import { patchQueries, useApiMutation } from "#/shared/api/mutation";
import { cameraKeys } from "#/features/cameras";
import { deleteLens, lensKeys, lensQueries, saveLens, setLensActive } from "./api";
import type { LensRow } from "./types";

export const useLensList = () => useQuery(lensQueries.list());

export const useSaveLens = () =>
  useApiMutation({
    fn: saveLens,
    // linked-lens lists on camera pages show lens names
    invalidates: () => [lensKeys.all, cameraKeys.details()],
    success: (v) => (v.id ? "Lens updated" : "Lens added"),
  });

export const useSetLensActive = () =>
  useApiMutation({
    fn: setLensActive,
    optimistic: {
      cancel: () => [lensKeys.lists()],
      apply: (qc, v) =>
        patchQueries<LensRow[]>(qc, { queryKey: lensKeys.lists() }, (rows) =>
          rows.map((r) =>
            r.lens.id === v.id ? { ...r, lens: { ...r.lens, active: v.active } } : r,
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
