import type { Lens } from "./types";

export const lensName = (
  l: Pick<Lens, "brand" | "model" | "focalLength" | "maxAperture"> | undefined,
) =>
  l
    ? `${[l.brand, l.model].filter(Boolean).join(" ")} ${l.focalLength}mm f/${l.maxAperture.toFixed(1)}`.trim()
    : "—";
