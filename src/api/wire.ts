import type { Lens } from "#/domain/types";

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
