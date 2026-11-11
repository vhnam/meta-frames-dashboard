import type { ScanSettings } from "#/features/scanners/types";
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
  /**
   * Grows with every change to the roll on the server; sent back as If-Match so an edit made
   * from this copy cannot overwrite a newer change. Null when the server did not report one.
   */
  version: number | null;
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
  /** Box ISO of the roll's stock: a single ISO or a range. */
  boxIso: string;
  cameraName: string | null;
  negativesAtLab: boolean;
}

/** The Rolls tabs past "All", in lifecycle order; the server derives a roll's stage. */
export const ROLL_STAGES = [
  "in_stock",
  "in_camera",
  "done_shooting",
  "processing",
  "completed",
] as const;
export type RollStage = (typeof ROLL_STAGES)[number];

/** The badge of a processing roll: what is being done to it, or what it waits for. */
export const STAGE_DETAILS = [
  "lab_developing",
  "lab_scanning",
  "home_developing",
  "home_scanning",
  "rescanning",
  "waiting_scan",
  "waiting_home_scan",
  "waiting_lab_scan",
  "printing",
] as const;
export type StageDetail = (typeof STAGE_DETAILS)[number];

/** Who does a step: the owner at home, or a lab. */
export type StepActor = "self" | "lab";

/** What the owner plans for a roll; a missing field is not decided yet. */
export interface RollPlan {
  target: "developed" | "scanned" | null;
  developBy: StepActor | null;
  scanBy: StepActor | null;
}

/** A row of the Rolls list: the roll with its stage and plan. */
export interface RollListRow extends RollRow {
  stage: RollStage;
  /** Set only while the stage is processing. */
  stageDetail: StageDetail | null;
  /** Marked for a scan (first scan or rescan) that has not started. */
  needsScan: boolean;
  plan: RollPlan;
}

/** Rolls handed to one lab together ("Hand to lab"): one job per roll. */
export interface HandOverInput {
  labId: string;
  /** ISO date; also the jobs' sent date. */
  handedAt: string;
  notes?: string;
  /** Scanners for every job that produces scans; ignored when none does. */
  scanOrders: ScanOrder[];
  rolls: { rollId: string; type: ProcessingType }[];
  /** The same for a resend of the same batch, so a batch saved before its reply was lost is not refused. */
  idempotencyKey: string;
}

/** One scanner ordered on a job; scanners live in their own list (see `#/features/scanners`). */
export interface ScanOrder {
  scannerId: string;
  /** Chosen scan options, by key; which ones exist depends on the scanner's kind. */
  settings: ScanSettings;
}

export interface RollJobScanOrder extends ScanOrder {
  /** Brand and model, as the API names the scanner. */
  scannerName: string;
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
  /** Develop jobs only: the day the film was developed, apart from the negatives coming back. */
  developedDate: string | null;
  /** From its order lines when the job is on an order, otherwise the job's own. */
  price: number | null;
  /** The order the job is billed on, and its lines there. */
  order: { id: string; code: string; items: { id: string; product: string }[] } | null;
  notes: string;
  scanOrders: RollJobScanOrder[];
  open: boolean;
}
export interface RollDetail extends Pick<
  RollListRow,
  "stage" | "stageDetail" | "needsScan" | "plan"
> {
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
  /** The lab stay that holds the roll; its return brings the negatives home. */
  openHandoffId: string | null;
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
].map((label, index) => ({ value: String(index + 1), label }));

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
 * Jobs that take a negatives-returned date. A print job closes only on it (PR-6), and a lab keeps
 * "Negatives at lab" set until it is recorded, so a scan at a lab takes one too (RO-25).
 */
export const recordsNegativesReturned = (type: ProcessingType, atLab: boolean) =>
  developsFilm(type) || type === "print" || (type === "scan" && atLab);
/**
 * The open develop job not developed yet ("Mark developed"). Negatives or scans back count as
 * developed, as in the server's stage rule, for jobs from before the developed date existed.
 */
export const developingJob = (jobs: RollJob[]) =>
  jobs.find(
    (job) =>
      job.open &&
      developsFilm(job.type) &&
      !job.developedDate &&
      !job.negativesReturnedDate &&
      !job.scansReceivedDate,
  );
/**
 * A roll done shooting with no job is developed at home in one step, so it can be marked too;
 * not while a lab holds it (a lab job cancelled before the roll came back).
 */
export const canStartHomeDevelop = (status: RollStatus, jobs: RollJob[], negativesAtLab: boolean) =>
  status === "done_shooting" && !jobs.length && !negativesAtLab;
export const canMarkDeveloped = (status: RollStatus, jobs: RollJob[], negativesAtLab: boolean) =>
  !!developingJob(jobs) || canStartHomeDevelop(status, jobs, negativesAtLab);
/**
 * Waiting for its scan, or marked for one where the API takes a scan job (`checkCanSend`: done
 * shooting, developed or scanned). A roll still developing keeps its mark until it is done. A
 * waiting roll whose negatives a lab holds (raw `at_lab`) still gets the action, which the page
 * shows disabled with the reason.
 */
export const canStartHomeScan = (
  status: RollStatus,
  stageDetail: StageDetail | null,
  needsScan: boolean,
) =>
  stageDetail === "waiting_scan" ||
  stageDetail === "waiting_home_scan" ||
  stageDetail === "waiting_lab_scan" ||
  (needsScan && (status === "done_shooting" || status === "developed" || status === "scanned"));
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
  /** VND. Not sent for a job on an order: its order lines set it. */
  price?: number;
  /** The order lines the job is billed on; replaces its set. */
  orderItemIds?: string[];
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
