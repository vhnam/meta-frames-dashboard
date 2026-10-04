import type { FilmStock } from "./types";

export const stockName = (s: Pick<FilmStock, "brand" | "name"> | undefined) =>
  s ? `${s.brand} ${s.name}` : "—";

export function stockWarnings(s: Pick<FilmStock, "type" | "process">): string[] {
  const out: string[] = [];
  if (s.type === "bw" && s.process !== "BW") out.push("B&W film usually uses process BW.");
  if (s.type === "slide" && s.process !== "E-6") out.push("Slide film usually uses process E-6.");
  return out;
}
