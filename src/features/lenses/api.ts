import { queryOptions } from "@tanstack/vue-query";
import { http } from "#/shared/api/http";
import { cameraName } from "#/features/cameras/format";
import type { Lens, LensInput, LensRow } from "./types";

export const lensKeys = {
  all: ["lenses"] as const,
  lists: () => [...lensKeys.all, "list"] as const,
  list: () => [...lensKeys.lists()] as const,
};

/** Meta-Frame API lens. */
export interface ApiLens {
  id: string;
  brand: string;
  model: string;
  mount?: string;
  description?: string;
  focalLength: number;
  maxAperture: number;
  isBuiltIn: boolean;
  isActive: boolean;
}

/** `builtInCameraId` is not on the wire: callers pass the owning camera when they know it. */
export const toLens = (l: ApiLens, builtInCameraId: string | null = null): Lens => ({
  id: l.id,
  brand: l.brand,
  model: l.model,
  mount: l.mount ?? "",
  focalLength: l.focalLength,
  maxAperture: l.maxAperture,
  description: l.description ?? "",
  active: l.isActive,
  // built-in lenses always carry a camera id, even if we could not resolve it
  builtInCameraId: l.isBuiltIn ? (builtInCameraId ?? "unknown") : null,
});

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

const toApiInput = (input: LensInput) => ({
  brand: input.brand.trim(),
  model: input.model.trim(),
  mount: input.mount.trim() || undefined,
  description: input.description.trim() || undefined,
  focalLength: input.focalLength,
  maxAperture: input.maxAperture,
});

export const saveLens = async (v: { id?: string; input: LensInput }) => {
  const body = toApiInput(v.input);
  if (v.id) {
    await http.put(`/lenses/${v.id}`, body);
    return v.id;
  }
  return (await http.post<ApiLens>("/lenses", body)).data.id;
};

export const setLensActive = async (v: { id: string; active: boolean }) => {
  await http.put(`/lenses/${v.id}/active`, { isActive: v.active });
};

export const deleteLens = async (id: string) => {
  await http.delete(`/lenses/${id}`);
};
