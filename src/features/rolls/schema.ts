import * as v from "valibot";
import { integer, picklist, required } from "#/shared/lib/schema";
import { PROCESSES } from "#/features/film-stocks/types";
import { FORMATS, PROCESSING_TYPES } from "./types";

const expiryYear = v.optional(integer(1900, "Enter a valid year."));
const expiryMonth = v.optional(
  v.pipe(
    v.number(),
    v.integer("Must be a whole number."),
    v.minValue(1, "Month is 1-12."),
    v.maxValue(12, "Month is 1-12."),
  ),
);
const price = v.optional(
  v.pipe(v.number("Enter a number."), v.minValue(0, "Price must be 0 or more.")),
);

export const AddRollsSchema = v.pipe(
  v.object({
    stockId: required("Select a film stock."),
    format: picklist(FORMATS),
    exposures: integer(1, "Exposures must be at least 1."),
    quantity: integer(1, "Quantity must be at least 1."),
    price,
    expiryYear,
    expiryMonth,
  }),
  v.forward(
    v.partialCheck(
      [["expiryYear"], ["expiryMonth"]],
      (i) => i.expiryMonth == null || i.expiryYear != null,
      "Month requires a year.",
    ),
    ["expiryMonth"],
  ),
);

/** Roll fields the API stores: stock, format, exposures, price and expiry. */
export const RollSchema = v.pipe(
  v.object({
    stockId: required("Select a film stock."),
    format: picklist(FORMATS),
    exposures: integer(1, "Exposures must be at least 1."),
    price,
    expiryYear,
    expiryMonth,
  }),
  v.forward(
    v.partialCheck(
      [["expiryYear"], ["expiryMonth"]],
      (i) => i.expiryMonth == null || i.expiryYear != null,
      "Month requires a year.",
    ),
    ["expiryMonth"],
  ),
);

export const LoadRollSchema = v.object({
  cameraId: required("Select a camera."),
  startedAt: v.optional(v.string()),
  shotIso: v.optional(integer(1, "ISO must be at least 1.")),
});

export const SendToLabSchema = v.object({
  labId: v.optional(v.string()),
  type: picklist(PROCESSING_TYPES),
  process: picklist(PROCESSES),
  price,
  sentAt: v.optional(v.string()),
  scansExpectedAt: v.optional(v.string()),
  negativesExpectedAt: v.optional(v.string()),
  notes: v.optional(v.string()),
  scansReceivedAt: v.optional(v.string()),
  negativesReturnedAt: v.optional(v.string()),
});
