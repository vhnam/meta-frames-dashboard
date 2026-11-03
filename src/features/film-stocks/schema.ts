import * as v from "valibot";
import { picklist, required } from "#/shared/lib/schema";
import { FILM_TYPES, PACKAGINGS, PROCESSES } from "./types";

/** A single ISO or a rising range: the server takes up to six digits each. */
const BOX_ISO = /^[1-9]\d{0,5}(-[1-9]\d{0,5})?$/;
const isRising = (boxIso: string) => {
  const [low, high] = boxIso.split("-").map(Number);
  return high === undefined || low < high;
};

export const StockSchema = v.object({
  brand: required("Brand is required."),
  name: required("Name is required."),
  type: picklist(FILM_TYPES),
  boxIso: v.pipe(
    v.string("Box ISO is required."),
    v.trim(),
    v.regex(BOX_ISO, "Enter an ISO or a range, like 400 or 100-400."),
    v.check(isRising, "A range must go from the lower ISO to the higher."),
  ),
  process: picklist(PROCESSES),
  packaging: picklist(PACKAGINGS),
  stockOrigin: v.string(),
  packOrigin: v.string(),
  baseStockId: v.string(),
  description: v.string(),
});
