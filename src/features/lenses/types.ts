export interface Lens {
  id: string;
  brand: string;
  model: string;
  /** Empty for built-in lenses. */
  mount: string;
  focalLength: number;
  maxAperture: number;
  description: string;
  active: boolean;
  /** Set when this lens is the built-in lens of a fixed-lens camera. */
  builtInCameraId: string | null;
}

export interface LensInput {
  brand: string;
  model: string;
  mount: string;
  focalLength: number;
  maxAperture: number;
  description: string;
}

export interface LensRow {
  lens: Lens;
  /** Set for built-in lenses of fixed-lens cameras. */
  cameraName: string | null;
}
