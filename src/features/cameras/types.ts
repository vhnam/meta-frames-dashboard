import type { Lens } from "#/features/lenses/types";

export interface Camera {
  id: string;
  brand: string;
  model: string;
  /** Empty for fixed-lens cameras. */
  mount: string;
  description: string;
  fixedLens: boolean;
  active: boolean;
}

export interface CameraInput {
  brand: string;
  model: string;
  mount: string;
  description: string;
  fixedLens: boolean;
}

export interface BuiltInLensInput {
  focalLength: number;
  maxAperture: number;
  brand?: string;
  model?: string;
}

export interface CameraRow {
  camera: Camera;
  loaded: { rollId: string; stockName: string; shotIso: number; daysLoaded: number } | null;
}

export interface CameraDetail {
  camera: Camera;
  /** Linked lenses (or the single built-in lens for fixed-lens cameras). */
  lenses: Lens[];
}
