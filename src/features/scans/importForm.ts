import type { NumberingMode, OnConflict } from "./types";

/** One file with the frame it will be stored under. */
export interface ImportEntry {
  file: File;
  frameNumber: number;
}

/**
 * The multipart body of `POST /processing/{id}/scans`: `scannerId` and `onConflict`, then one
 * `frameNumber` field immediately before each `file` part (the server pairs them by position).
 */
export function buildImportForm(
  scannerId: string,
  onConflict: OnConflict,
  entries: readonly ImportEntry[],
): FormData {
  const form = new FormData();
  form.append("scannerId", scannerId);
  form.append("onConflict", onConflict);
  for (const entry of entries) {
    form.append("frameNumber", String(entry.frameNumber));
    form.append("file", entry.file, entry.file.name);
  }
  return form;
}

/** The body of `POST /processing/{id}/scans/preview` for the numbering the user picked. */
export function previewBody(
  fileNames: readonly string[],
  mode: NumberingMode,
  startFrame: number,
  offset: number,
) {
  return mode === "sequential"
    ? { fileNames, startFrame }
    : { fileNames, ...(offset ? { offset } : {}) };
}
