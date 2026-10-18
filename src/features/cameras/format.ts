import type { Camera } from "./types";

export const cameraName = (camera: Pick<Camera, "brand" | "model"> | undefined) =>
  camera ? `${camera.brand} ${camera.model}` : "—";
