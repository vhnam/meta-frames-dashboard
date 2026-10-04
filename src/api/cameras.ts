import { keepPreviousData, queryOptions, useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import type { BuiltInLensInput, CameraInput } from "#/domain/inputs";
import type { Camera, Lens } from "#/domain/types";
import { isAxiosError } from "axios";
import { http } from "./http";
import { cameraKeys, lensKeys } from "./keys";
import { patchQueries, useApiMutation } from "./mutation";
import { toLens } from "./wire";
import type { ApiLens } from "./wire";

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

export interface CameraRow {
  camera: Camera;
  loaded: { rollId: string; stockName: string; shotIso: number; daysLoaded: number } | null;
}
export interface CameraDetail {
  camera: Camera;
  /** Linked lenses (or the single built-in lens for fixed-lens cameras). */
  lenses: Lens[];
}

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

export const useCameraList = (includeInactive: MaybeRefOrGetter<boolean> = false) =>
  useQuery(() => ({
    ...cameraQueries.list({ includeInactive: toValue(includeInactive) }),
    placeholderData: keepPreviousData,
  }));

export const useCameraDetail = (id: MaybeRefOrGetter<string | undefined>) =>
  useQuery(() => ({
    ...cameraQueries.detail(toValue(id) ?? ""),
    enabled: !!toValue(id),
  }));

// ---- mutations ----

export const useSaveCamera = () =>
  useApiMutation({
    fn: async (v: { id?: string; input: CameraInput; builtIn?: BuiltInLensInput }) => {
      const body = toApiInput(v.input, v.builtIn);
      if (v.id) {
        await http.put(`/cameras/${v.id}`, body);
        return v.id;
      }
      return (await http.post<ApiCamera>("/cameras", body)).data.id;
    },
    // a fixed-lens camera also creates / renames its built-in lens
    invalidates: () => [cameraKeys.all, lensKeys.all],
    success: (v) => (v.id ? "Camera updated" : "Camera added"),
  });

/** Optimistic: the switch flips immediately and rolls back if the rule rejects it. */
export const useSetCameraActive = () =>
  useApiMutation({
    fn: async (v: { id: string; active: boolean }) => {
      await http.put(`/cameras/${v.id}/active`, { isActive: v.active });
    },
    optimistic: {
      cancel: (v) => [cameraKeys.lists(), cameraKeys.detail(v.id)],
      apply: (qc, v) => {
        const flip = (c: Camera) => (c.id === v.id ? { ...c, active: v.active } : c);
        const undoLists = patchQueries<CameraRow[]>(qc, { queryKey: cameraKeys.lists() }, (rows) =>
          rows.map((r) => ({ ...r, camera: flip(r.camera) })),
        );
        const undoDetail = patchQueries<CameraDetail | null>(
          qc,
          { queryKey: cameraKeys.detail(v.id) },
          (d) => (d ? { ...d, camera: flip(d.camera) } : d),
        );
        return () => (undoLists(), undoDetail());
      },
    },
    // the built-in lens follows the camera's active state
    invalidates: (v) => [cameraKeys.lists(), cameraKeys.detail(v.id), lensKeys.lists()],
  });

export const useDeleteCamera = () =>
  useApiMutation({
    fn: async (id: string) => {
      await http.delete(`/cameras/${id}`);
    },
    invalidates: () => [cameraKeys.all, lensKeys.all],
    success: "Camera deleted",
  });

export const useSetCameraLenses = () =>
  useApiMutation({
    fn: async (v: { cameraId: string; lensIds: string[] }) => {
      await http.put(`/cameras/${v.cameraId}/lenses`, { lensIds: v.lensIds });
    },
    invalidates: (v) => [cameraKeys.detail(v.cameraId)],
    success: "Lenses updated",
  });
