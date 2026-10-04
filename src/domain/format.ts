// Pure formatting helpers: no store access, safe to use anywhere.
import type { Camera, FilmStock, Lens, Roll } from "./types";

export const cameraName = (c: Pick<Camera, "brand" | "model"> | undefined) =>
  c ? `${c.brand} ${c.model}` : "—";

export const stockName = (s: Pick<FilmStock, "brand" | "name"> | undefined) =>
  s ? `${s.brand} ${s.name}` : "—";

export const lensName = (
  l: Pick<Lens, "brand" | "model" | "focalLength" | "maxAperture"> | undefined,
) =>
  l
    ? `${[l.brand, l.model].filter(Boolean).join(" ")} ${l.focalLength}mm f/${l.maxAperture.toFixed(1)}`.trim()
    : "—";

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const daysSince = (iso: string | null) =>
  iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : 0;

export function expiryDate(roll: Pick<Roll, "expiryYear" | "expiryMonth">): Date | null {
  if (!roll.expiryYear) return null;
  const month = roll.expiryMonth ?? 12;
  return new Date(roll.expiryYear, month, 0, 23, 59, 59);
}

export const isExpired = (roll: Pick<Roll, "expiryYear" | "expiryMonth">, now = new Date()) => {
  const d = expiryDate(roll);
  return !!d && d < now;
};

export const formatExpiry = (roll: Pick<Roll, "expiryYear" | "expiryMonth">) =>
  roll.expiryYear
    ? roll.expiryMonth
      ? `${String(roll.expiryMonth).padStart(2, "0")}/${roll.expiryYear}`
      : String(roll.expiryYear)
    : "—";

export const formatVnd = (n: number | null | undefined) =>
  n == null ? "—" : `${new Intl.NumberFormat("vi-VN").format(n)} ₫`;

export function stockWarnings(s: Pick<FilmStock, "type" | "process">): string[] {
  const out: string[] = [];
  if (s.type === "bw" && s.process !== "BW") out.push("B&W film usually uses process BW.");
  if (s.type === "slide" && s.process !== "E-6") out.push("Slide film usually uses process E-6.");
  return out;
}
