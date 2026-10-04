import type { FilmStock } from "./types";

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
export interface LensInput {
  brand: string;
  model: string;
  mount: string;
  focalLength: number;
  maxAperture: number;
  description: string;
}
export type StockInput = Omit<FilmStock, "id">;
