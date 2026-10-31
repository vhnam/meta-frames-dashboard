export const SCANNER_KINDS = [
  "minilab",
  "virtual_drum",
  "drum",
  "dedicated_film",
  "flatbed",
  "camera",
] as const;
export type ScannerKind = (typeof SCANNER_KINDS)[number];
export const SCANNER_KIND_LABELS: Record<ScannerKind, string> = {
  minilab: "Lab minilab",
  virtual_drum: "Virtual drum",
  drum: "Drum",
  dedicated_film: "Film scanner",
  flatbed: "Flatbed",
  camera: "Camera scan",
};

/** Chosen value of each scan option, by option key. */
export type ScanSettings = Record<string, string | number | boolean>;

export interface ScanOption {
  key: string;
  label: string;
  type: "enum" | "boolean" | "integer";
  /** Choices of an enum option. */
  values?: { value: string; label: string }[];
  min?: number;
  max?: number;
  /** Value used when the option is left out. */
  default: string | number | boolean;
}

/** Scan options of a scanner kind, as the API lists them; `kind` null is a scanner of unknown kind. */
export interface ScannerKindOptions {
  kind: ScannerKind | null;
  label: string;
  options: ScanOption[];
}

export interface Scanner {
  id: string;
  brand: string;
  /** Empty when unknown, as for a lab's Noritsu whose model nobody knows. */
  model: string;
  /** Brand and model (the brand alone without a model), as the API shows it. */
  name: string;
  kind: ScannerKind | null;
  notes: string;
  /** Settings a new scan order on this scanner starts from. */
  defaultSettings: ScanSettings;
  /** Shared catalog scanner (Noritsu HS-1800, Frontier SP-3000): visible to all, read-only. */
  builtIn: boolean;
}

/** Ids of the built-in scanners; fixed by the API's migration. */
export const NORITSU_HS1800 = "d177cb3c-a850-4232-a4ca-75189b7b279b";
export const FRONTIER_SP3000 = "e2bf4cbd-87a8-4a17-8340-516b1a1cc6bc";
