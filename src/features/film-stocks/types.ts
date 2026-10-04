export const FILM_TYPES = ["color", "bw", "slide"] as const;
export const PROCESSES = ["C-41", "E-6", "BW", "ECN-2"] as const;
export const PACKAGINGS = ["factory", "repack", "respooled"] as const;

export type FilmType = (typeof FILM_TYPES)[number];
export type Process = (typeof PROCESSES)[number];
export type Packaging = (typeof PACKAGINGS)[number];

export const FILM_TYPE_LABELS: Record<FilmType, string> = {
  color: "Color",
  bw: "B&W",
  slide: "Slide",
};

export const PACKAGING_LABELS: Record<Packaging, string> = {
  factory: "Factory",
  repack: "Repack",
  respooled: "Re-spooled",
};

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

export type StockInput = Omit<FilmStock, "id">;

export interface StockRow {
  stock: FilmStock;
  baseName: string | null;
}
export interface StockDetail {
  stock: FilmStock;
  base: FilmStock | null;
  siblings: FilmStock[];
  children: FilmStock[];
}
export interface InventoryRow {
  stock: FilmStock;
  byFormat: Record<string, number>;
  expiryLabel: string;
}
export interface InventoryFilters {
  type?: string;
  process?: string;
  iso?: number;
}
