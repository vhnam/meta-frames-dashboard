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
    success: (variables) => (variables.id ? "Camera updated" : "Camera added"),
  });

/** Optimistic: the switch flips immediately and rolls back if the rule rejects it. */
export const useSetCameraActive = () =>
  useApiMutation({
    fn: setCameraActive,
    optimistic: {
      cancel: (variables) => [cameraKeys.lists(), cameraKeys.detail(variables.id)],
      apply: (qc, variables) => {
        const flip = (camera: Camera) =>
          camera.id === variables.id ? { ...camera, active: variables.active } : camera;
        const undoLists = patchQueries<CameraRow[]>(qc, { queryKey: cameraKeys.lists() }, (rows) =>
          rows.map((row) => ({ ...row, camera: flip(row.camera) })),
        );
        const undoDetail = patchQueries<CameraDetail | null>(
          qc,
          { queryKey: cameraKeys.detail(variables.id) },
          (detail) => (detail ? { ...detail, camera: flip(detail.camera) } : detail),
        );
        return () => (undoLists(), undoDetail());
      },
    },
    // the built-in lens follows the camera's active state
    invalidates: (variables) => [
      cameraKeys.lists(),
      cameraKeys.detail(variables.id),
      lensKeys.lists(),
    ],
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
    invalidates: (variables) => [cameraKeys.detail(variables.cameraId)],
    success: "Lenses updated",
  });
