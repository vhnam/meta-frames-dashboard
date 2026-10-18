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
export const toLens = (lens: ApiLens, builtInCameraId: string | null = null): Lens => ({
  id: lens.id,
  brand: lens.brand,
  model: lens.model,
  mount: lens.mount ?? "",
  focalLength: lens.focalLength,
  maxAperture: lens.maxAperture,
  description: lens.description ?? "",
  active: lens.isActive,
  // built-in lenses always carry a camera id, even if we could not resolve it
  builtInCameraId: lens.isBuiltIn ? (builtInCameraId ?? "unknown") : null,
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
          cameras
            .filter((camera) => camera.builtInLensId)
            .map((camera) => [camera.builtInLensId, camera]),
        );
        return lenses
          .map((lens): LensRow => {
            const camera = owner.get(lens.id);
            return {
              lens: toLens(lens, camera?.id ?? null),
              cameraName: camera ? cameraName({ brand: camera.brand, model: camera.model }) : null,
            };
          })
          .sort((left, right) => left.lens.focalLength - right.lens.focalLength);
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

export const saveLens = async (variables: { id?: string; input: LensInput }) => {
  const body = toApiInput(variables.input);
  if (variables.id) {
    await http.put(`/lenses/${variables.id}`, body);
    return variables.id;
  }
  return (await http.post<ApiLens>("/lenses", body)).data.id;
};

export const setLensActive = async (variables: { id: string; active: boolean }) => {
  await http.put(`/lenses/${variables.id}/active`, { isActive: variables.active });
};

export const deleteLens = async (id: string) => {
  await http.delete(`/lenses/${id}`);
};
