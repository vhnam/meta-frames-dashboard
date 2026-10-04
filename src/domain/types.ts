export const FILM_TYPES = ["color", "bw", "slide"] as const;
export const PROCESSES = ["C-41", "E-6", "BW", "ECN-2"] as const;
export const PACKAGINGS = ["factory", "repack", "respooled"] as const;
export const ROLL_STATUSES = [
  "in_stock",
  "in_camera",
  "done_shooting",
  "at_lab",
  "developed",
  "scanned",
] as const;
export const FORMATS = ["135", "120", "110", "4x5"] as const;

export type FilmType = (typeof FILM_TYPES)[number];

export const FILM_TYPE_LABELS: Record<FilmType, string> = {
  color: "Color",
  bw: "B&W",
  slide: "Slide",
};
export type Process = (typeof PROCESSES)[number];
export type Packaging = (typeof PACKAGINGS)[number];

export const PACKAGING_LABELS: Record<Packaging, string> = {
  factory: "Factory",
  repack: "Repack",
  respooled: "Re-spooled",
};
export type RollStatus = (typeof ROLL_STATUSES)[number];

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

export interface FilmStock {
  id: string;
  brand: string;
  name: string;
  type: FilmType;
  boxIso: number;
  process: Process;
  packaging: Packaging;
  stockOrigin: string;
  packOrigin: string;
  description: string;
  baseStockId: string | null;
}

export interface Roll {
  id: string;
  stockId: string;
  format: string;
  exposures: number;
  /** VND per roll, shipping excluded. */
  price: number | null;
  expiryYear: number | null;
  expiryMonth: number | null;
  status: RollStatus;
  cameraId: string | null;
  lensIds: string[];
  /** Null when shot at box ISO. */
  shotIso: number | null;
  startDate: string | null;
  finishDate: string | null;
  description: string;
  /** Purchase date (ISO). */
  createdAt: string;
}

export interface Lab {
  id: string;
  name: string;
  address: string;
}

export interface Frame {
  id: string;
  rollId: string;
  number: number;
  notes: string;
}
