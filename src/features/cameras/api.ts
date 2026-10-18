import { queryOptions } from "@tanstack/vue-query";
import { isAxiosError } from "axios";
import { http } from "#/shared/api/http";
import { toLens } from "#/features/lenses/api";
import type { ApiLens } from "#/features/lenses/api";
import type { BuiltInLensInput, Camera, CameraDetail, CameraInput, CameraRow } from "./types";

export const cameraKeys = {
  all: ["cameras"] as const,
  lists: () => [...cameraKeys.all, "list"] as const,
  list: (filters: { includeInactive: boolean }) => [...cameraKeys.lists(), filters] as const,
  details: () => [...cameraKeys.all, "detail"] as const,
  detail: (id: string) => [...cameraKeys.details(), id] as const,
};

// ---- wire format (Meta-Frame API) ----

export interface ApiCamera {
  id: string;
  brand: string;
  model: string;
  mount?: string;
  description?: string;
  hasFixedLens: boolean;
  isActive: boolean;
  loadedRoll?: {
    rollId: string;
    stockName: string;
    shotIso: number;
    daysLoaded: number;
  };
}

export const toCamera = (camera: ApiCamera): Camera => ({
  id: camera.id,
  brand: camera.brand,
  model: camera.model,
  mount: camera.mount ?? "",
  description: camera.description ?? "",
  fixedLens: camera.hasFixedLens,
  active: camera.isActive,
});

const toApiInput = (input: CameraInput, builtIn?: BuiltInLensInput) => ({
  brand: input.brand.trim(),
  model: input.model.trim(),
  ...(input.fixedLens ? {} : { mount: input.mount.trim() }),
  description: input.description.trim() || undefined,
  hasFixedLens: input.fixedLens,
  ...(input.fixedLens && builtIn ? { fixedLens: builtIn } : {}),
});

// ---- queries ----

export const cameraQueries = {
  list: (filters: { includeInactive: boolean }) =>
    queryOptions({
      queryKey: cameraKeys.list(filters),
      queryFn: async (): Promise<CameraRow[]> => {
        const { data } = await http.get<ApiCamera[]>("/cameras", {
          params: { activeOnly: !filters.includeInactive },
        });
        return data.map((camera) => ({
          camera: toCamera(camera),
          loaded: camera.loadedRoll
            ? {
                rollId: camera.loadedRoll.rollId,
                stockName: camera.loadedRoll.stockName,
                shotIso: camera.loadedRoll.shotIso,
                daysLoaded: camera.loadedRoll.daysLoaded,
              }
            : null,
        }));
      },
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: cameraKeys.detail(id),
      queryFn: async (): Promise<CameraDetail | null> => {
        try {
          const [{ data: camera }, { data: lenses }] = await Promise.all([
            http.get<ApiCamera>(`/cameras/${id}`),
            http.get<ApiLens[]>(`/cameras/${id}/lenses`),
          ]);
          return {
            camera: toCamera(camera),
            lenses: lenses.map((lens) => toLens(lens, camera.hasFixedLens ? id : null)),
          };
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) return null;
          throw error;
        }
      },
    }),
};

// ---- writes ----

export const saveCamera = async (variables: {
  id?: string;
  input: CameraInput;
  builtIn?: BuiltInLensInput;
}) => {
  const body = toApiInput(variables.input, variables.builtIn);
  if (variables.id) {
    await http.put(`/cameras/${variables.id}`, body);
    return variables.id;
  }
  return (await http.post<ApiCamera>("/cameras", body)).data.id;
};

export const setCameraActive = async (variables: { id: string; active: boolean }) => {
  await http.put(`/cameras/${variables.id}/active`, { isActive: variables.active });
};

export const deleteCamera = async (id: string) => {
  await http.delete(`/cameras/${id}`);
};

export const setCameraLenses = async (variables: { cameraId: string; lensIds: string[] }) => {
  await http.put(`/cameras/${variables.cameraId}/lenses`, { lensIds: variables.lensIds });
};
