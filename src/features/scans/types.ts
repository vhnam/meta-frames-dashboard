/** One scan of one frame, as `GET /processing/{id}/scans` lists it. */
export interface Scan {
  id: string;
  processingId: string;
  frameNumber: number;
  scannerId: string;
  scannerName: string;
  fileName: string;
  sizeBytes: number;
}

/** What the server read from a file name: a frame number, or why it could not. */
export interface ImportPreviewItem {
  fileName: string;
  frameNumber?: number;
  error?: string;
}

export interface ImportFailure {
  fileName: string;
  reason: string;
}

export interface ImportResult {
  imported: Scan[];
  skipped: ImportFailure[];
  failed: ImportFailure[];
  scansReceivedAt: string;
}

export type OnConflict = "skip" | "replace";

/** How frame numbers are chosen: read from the file names, or counted from a start frame. */
export type NumberingMode = "names" | "sequential";

export interface FrameComparison {
  frameNumber: number;
  /** Every scan of the frame in this job, one per scanner. */
  scans: Scan[];
  previousFrameNumber: number | null;
  nextFrameNumber: number | null;
}
