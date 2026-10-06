import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import { patchQueries, useApiMutation } from "#/shared/api/mutation";
import { lensKeys } from "#/features/lenses";
import {
  cameraKeys,
  cameraQueries,
  deleteCamera,
  saveCamera,
  setCameraActive,
  setCameraLenses,
} from "./api";
import type { Camera, CameraDetail, CameraRow } from "./types";

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

export const useSaveCamera = () =>
  useApiMutation({
    fn: saveCamera,
    // a fixed-lens camera also creates / renames its built-in lens
    invalidates: () => [cameraKeys.all, lensKeys.all],
    success: (v) => (v.id ? "Camera updated" : "Camera added"),
  });

/** Optimistic: the switch flips immediately and rolls back if the rule rejects it. */
export const useSetCameraActive = () =>
  useApiMutation({
    fn: setCameraActive,
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
    fn: deleteCamera,
    invalidates: () => [cameraKeys.all, lensKeys.all],
    success: "Camera deleted",
  });

export const useSetCameraLenses = () =>
  useApiMutation({
    fn: setCameraLenses,
    invalidates: (v) => [cameraKeys.detail(v.cameraId)],
    success: "Lenses updated",
  });
