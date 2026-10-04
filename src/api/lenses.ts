import { queryOptions, useQuery } from "@tanstack/vue-query";
import type { LensInput } from "#/domain/inputs";
import { cameraName } from "#/domain/format";
import type { Lens } from "#/domain/types";
import { http } from "./http";
import { cameraKeys, lensKeys } from "./keys";
import { patchQueries, useApiMutation } from "./mutation";
import { toLens } from "./wire";
import type { ApiLens } from "./wire";

export interface LensRow {
  lens: Lens;
  /** Set for built-in lenses of fixed-lens cameras. */
  cameraName: string | null;
}

interface ApiCameraRef {
  id: string;
  brand: string;
  model: string;
  builtInLensId?: string;
}

export const lensQueries = {
  list: () =>
    queryOptions({
      queryKey: lensKeys.list(),
      queryFn: async (): Promise<LensRow[]> => {
        const [{ data: lenses }, { data: cameras }] = await Promise.all([
          http.get<ApiLens[]>("/lenses"),
          http.get<ApiCameraRef[]>("/cameras"),
        ]);
        // a built-in lens belongs to the camera that points at it
        const owner = new Map(
          cameras.filter((c) => c.builtInLensId).map((c) => [c.builtInLensId, c]),
        );
        return lenses
          .map((l): LensRow => {
            const camera = owner.get(l.id);
            return {
              lens: toLens(l, camera?.id ?? null),
              cameraName: camera ? cameraName({ brand: camera.brand, model: camera.model }) : null,
            };
          })
          .sort((a, b) => a.lens.focalLength - b.lens.focalLength);
      },
    }),
};

export const useLensList = () => useQuery(lensQueries.list());

const toApiInput = (input: LensInput) => ({
  brand: input.brand.trim(),
  model: input.model.trim(),
  mount: input.mount.trim() || undefined,
  description: input.description.trim() || undefined,
  focalLength: input.focalLength,
  maxAperture: input.maxAperture,
});

export const useSaveLens = () =>
  useApiMutation({
    fn: async (v: { id?: string; input: LensInput }) => {
      const body = toApiInput(v.input);
      if (v.id) {
        await http.put(`/lenses/${v.id}`, body);
        return v.id;
      }
      return (await http.post<ApiLens>("/lenses", body)).data.id;
    },
    // linked-lens lists on camera pages show lens names
    invalidates: () => [lensKeys.all, cameraKeys.details()],
    success: (v) => (v.id ? "Lens updated" : "Lens added"),
  });

export const useSetLensActive = () =>
  useApiMutation({
    fn: async (v: { id: string; active: boolean }) => {
      await http.put(`/lenses/${v.id}/active`, { isActive: v.active });
    },
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
    fn: async (id: string) => {
      await http.delete(`/lenses/${id}`);
    },
    invalidates: () => [lensKeys.all, cameraKeys.details()],
    success: "Lens deleted",
  });
