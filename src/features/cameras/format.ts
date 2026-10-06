import type { Camera } from "./types";

export const cameraName = (c: Pick<Camera, "brand" | "model"> | undefined) =>
  c ? `${c.brand} ${c.model}` : "—";
