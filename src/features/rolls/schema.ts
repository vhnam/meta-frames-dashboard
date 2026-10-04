import * as v from "valibot";
import { integer, picklist, required } from "#/shared/lib/schema";
import { FORMATS } from "./types";

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
