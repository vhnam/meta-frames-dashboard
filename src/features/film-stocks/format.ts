import type { FilmStock, FilmType, Packaging, Process } from "./types";

const tone = {
  amber: "border-transparent bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100",
  zinc: "border-transparent bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
  sky: "border-transparent bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-100",
  violet:
    "border-transparent bg-violet-100 text-violet-950 dark:bg-violet-950 dark:text-violet-100",
  emerald:
    "border-transparent bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100",
} as const;

export const TYPE_TONE: Record<FilmType, string> = {
  color: tone.amber,
  bw: tone.zinc,
  slide: tone.sky,
};

export const PROCESS_TONE: Record<Process, string> = {
  "C-41": tone.amber,
  "E-6": tone.sky,
  BW: tone.zinc,
  "ECN-2": tone.violet,
};

export const PACKAGING_TONE: Record<Packaging, string> = {
  factory: tone.emerald,
  repack: tone.amber,
  respooled: tone.violet,
};

export const stockName = (s: Pick<FilmStock, "brand" | "name"> | undefined) =>
  s ? `${s.brand} ${s.name}` : "—";

export function stockWarnings(s: Pick<FilmStock, "type" | "process">): string[] {
  const out: string[] = [];
  if (s.type === "bw" && s.process !== "BW") out.push("B&W film usually uses process BW.");
  if (s.type === "slide" && s.process !== "E-6") out.push("Slide film usually uses process E-6.");
  return out;
}
