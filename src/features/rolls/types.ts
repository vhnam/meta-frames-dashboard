import type { Camera } from "#/features/cameras/types";
import type { FilmStock, Process } from "#/features/film-stocks/types";
import type { Lens } from "#/features/lenses/types";

export const ROLL_STATUSES = [
  "in_stock",
  "in_camera",
  "done_shooting",
  "at_lab",
  "developed",
  "scanned",
] as const;
export const FORMATS = ["135", "120", "110", "4x5"] as const;

export type RollStatus = (typeof ROLL_STATUSES)[number];

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

export interface Frame {
  id: string;
  rollId: string;
  number: number;
  notes: string;
}

export interface RollFilters {
  stockId?: string;
  cameraId?: string;
  lensId?: string;
  format?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface AddRollsInput {
  stockId: string;
  format: string;
  exposures: number;
  quantity: number;
  price: number | null;
  expiryYear: number | null;
  expiryMonth: number | null;
}

export interface UpdateRollInput {
  stockId: string;
  format: string;
  exposures: number;
  price: number | null;
  expiryYear: number | null;
  expiryMonth: number | null;
}

export interface RollRow {
  roll: Roll;
  stockName: string;
  /** Box ISO of the roll's stock. */
  boxIso: number;
  cameraName: string | null;
  negativesAtLab: boolean;
}
export const SCANNERS = ["noritsu", "frontier", "other"] as const;
export type Scanner = (typeof SCANNERS)[number];
/** Display names are client-side labels; the API only knows the ids. */
export const SCANNER_LABELS: Record<Scanner, string> = {
  noritsu: "Noritsu HS-1800",
  frontier: "Frontier SP-3000",
  other: "Other scanner",
};

export interface ScanOrder {
  scanner: Scanner;
  hiRes: boolean;
}

export interface RollJobScanOrder extends ScanOrder {
  /** Scans imported for this scanner so far. */
  scanCount: number;
}

export interface RollJob {
  id: string;
  /** Absent when developed at home. */
  labId: string | null;
  labName: string;
  type: ProcessingType;
  process: Process;
  sentDate: string;
  scansExpectedDate: string | null;
  negativesExpectedDate: string | null;
  scansReceivedDate: string | null;
  negativesReturnedDate: string | null;
  price: number | null;
  notes: string;
  scanOrders: RollJobScanOrder[];
  open: boolean;
}
export interface RollDetail {
  roll: Roll;
  stock: FilmStock;
  base: FilmStock | null;
  camera: Camera | null;
  lenses: Lens[];
  /** Lenses linked to the roll's camera: candidates for the lens picker. */
  cameraLenses: Lens[];
  jobs: RollJob[];
  frames: { frame: Frame; scanCount: number }[];
  cost: { total: number; incomplete: boolean };
  negativesAtLab: boolean;
}

export interface ExpiryReport {
  dated: (RollRow & { expired: boolean })[];
  undated: RollRow[];
}

export const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, i) => ({ value: String(i + 1), label }));

export interface LoadRollInput {
  cameraId: string;
  /** Date loaded (ISO date). The API picks the day when omitted. */
  startedAt?: string;
  /** Omitted when shot at box ISO. */
  shotIso?: number;
}

export const PROCESSING_TYPES = ["develop", "develop_scan", "scan", "print"] as const;
export type ProcessingType = (typeof PROCESSING_TYPES)[number];
/** Job types that produce scans, and so need at least one scanner. */
export const producesScans = (type: ProcessingType) => type === "develop_scan" || type === "scan";
/** Job types that develop the film, so the lab returns negatives. */
export const developsFilm = (type: ProcessingType) => type === "develop" || type === "develop_scan";
/**
 * Services a roll can be sent for now. Developing happens once: after the first job only scan and
 * print remain, and none while the roll is still at the lab or not yet finished.
 */
export const sendableTypes = (status: RollStatus, jobCount: number): ProcessingType[] => {
  if (status === "done_shooting") return jobCount ? ["scan", "print"] : [...PROCESSING_TYPES];
  if (status === "scanned" || status === "developed") return ["scan", "print"];
  return [];
};
export const PROCESSING_TYPE_LABELS: Record<(typeof PROCESSING_TYPES)[number], string> = {
  develop: "Develop",
  develop_scan: "Develop + scan",
  scan: "Scan",
  print: "Print",
};

export interface SendToLabInput {
  /** Empty when developed at home. */
  labId?: string;
  type: ProcessingType;
  process: Process;
  /** VND. */
  price?: number;
  /** Date sent (ISO date). */
  sentAt?: string;
  /** When the lab expects to return the scans (ISO date, not before sentAt). */
  scansExpectedAt?: string;
  /** Jobs without scans: when the lab expects to return the negatives (not before sentAt). */
  negativesExpectedAt?: string;
  notes?: string;
  /** Replaces the job's scanner set; empty for develop and print. */
  scanOrders: ScanOrder[];
}
