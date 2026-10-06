import type { Roll } from "./types";

type Expiry = Pick<Roll, "expiryYear" | "expiryMonth">;

export function expiryDate(roll: Expiry): Date | null {
  if (!roll.expiryYear) return null;
  const month = roll.expiryMonth ?? 12;
  return new Date(roll.expiryYear, month, 0, 23, 59, 59);
}

export const isExpired = (roll: Expiry, now = new Date()) => {
  const d = expiryDate(roll);
  return !!d && d < now;
};

export const formatExpiry = (roll: Expiry) =>
  roll.expiryYear
    ? roll.expiryMonth
      ? `${String(roll.expiryMonth).padStart(2, "0")}/${roll.expiryYear}`
      : String(roll.expiryYear)
    : "—";
