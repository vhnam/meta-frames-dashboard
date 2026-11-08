import { formatDate, formatVnd, plainText } from "#/shared/lib/format";
import type { Roll } from "./types";

type Expiry = Pick<Roll, "expiryYear" | "expiryMonth">;

export function expiryDate(roll: Expiry): Date | null {
  if (!roll.expiryYear) return null;
  const month = roll.expiryMonth ?? 12;
  return new Date(roll.expiryYear, month, 0, 23, 59, 59);
}

export const isExpired = (roll: Expiry, now = new Date()) => {
  const date = expiryDate(roll);
  return !!date && date < now;
};

export const formatExpiry = (roll: Expiry) =>
  roll.expiryYear
    ? roll.expiryMonth
      ? `${String(roll.expiryMonth).padStart(2, "0")}/${roll.expiryYear}`
      : String(roll.expiryYear)
    : "—";

const months = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "Expired 2 months ago", "Expires this month" or "Expires in 3 months"; null when undated. */
export function expiryFromNow(roll: Expiry, now = new Date()): string | null {
  if (!roll.expiryYear) return null;
  const diff =
    (roll.expiryYear - now.getFullYear()) * 12 + (roll.expiryMonth ?? 12) - (now.getMonth() + 1);
  return `${isExpired(roll, now) ? "Expired" : "Expires"} ${months.format(diff, "month")}`;
}

export interface RollChange {
  label: string;
  /** As the edit was based on. */
  before: string;
  /** As the server has it now. */
  now: string;
}

/**
 * What changed between the copy of a roll an edit was based on and the server's current one,
 * field by field, for showing the user before they decide what to keep. `stockLabel` names a
 * film stock id.
 */
export function rollChanges(
  before: Roll,
  now: Roll,
  stockLabel: (stockId: string) => string,
): RollChange[] {
  const fields: [string, (roll: Roll) => string][] = [
    ["Film stock", (roll) => stockLabel(roll.stockId)],
    ["Format", (roll) => roll.format],
    ["Exposures", (roll) => String(roll.exposures)],
    ["Unit price", (roll) => formatVnd(roll.price)],
    ["Expiry", (roll) => formatExpiry(roll)],
    ["Status", (roll) => roll.status],
    ["Shot ISO", (roll) => (roll.shotIso === null ? "Box speed" : String(roll.shotIso))],
    ["Started", (roll) => formatDate(roll.startDate)],
    ["Finished", (roll) => formatDate(roll.finishDate)],
    ["Notes", (roll) => plainText(roll.description) || "—"],
  ];
  return fields.flatMap(([label, show]) =>
    show(before) === show(now) ? [] : [{ label, before: show(before), now: show(now) }],
  );
}
