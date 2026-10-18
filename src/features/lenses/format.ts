import type { Lens } from "./types";

export const lensName = (
  lens: Pick<Lens, "brand" | "model" | "focalLength" | "maxAperture"> | undefined,
) =>
  lens
    ? `${[lens.brand, lens.model].filter(Boolean).join(" ")} ${lens.focalLength}mm f/${lens.maxAperture.toFixed(1)}`.trim()
    : "—";
