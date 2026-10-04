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

export const toCamera = (c: ApiCamera): Camera => ({
  id: c.id,
  brand: c.brand,
  model: c.model,
  mount: c.mount ?? "",
  description: c.description ?? "",
  fixedLens: c.hasFixedLens,
  active: c.isActive,
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
        return data.map((c) => ({
          camera: toCamera(c),
          loaded: c.loadedRoll
            ? {
                rollId: c.loadedRoll.rollId,
                stockName: c.loadedRoll.stockName,
                shotIso: c.loadedRoll.shotIso,
                daysLoaded: c.loadedRoll.daysLoaded,
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
            lenses: lenses.map((l) => toLens(l, camera.hasFixedLens ? id : null)),
          };
        } catch (e) {
          if (isAxiosError(e) && e.response?.status === 404) return null;
          throw e;
        }
      },
    }),
};

// ---- writes ----

export const saveCamera = async (v: {
  id?: string;
  input: CameraInput;
  builtIn?: BuiltInLensInput;
}) => {
  const body = toApiInput(v.input, v.builtIn);
  if (v.id) {
    await http.put(`/cameras/${v.id}`, body);
    return v.id;
  }
  return (await http.post<ApiCamera>("/cameras", body)).data.id;
};

export const setCameraActive = async (v: { id: string; active: boolean }) => {
  await http.put(`/cameras/${v.id}/active`, { isActive: v.active });
};

export const deleteCamera = async (id: string) => {
  await http.delete(`/cameras/${id}`);
};

export const setCameraLenses = async (v: { cameraId: string; lensIds: string[] }) => {
  await http.put(`/cameras/${v.cameraId}/lenses`, { lensIds: v.lensIds });
};
