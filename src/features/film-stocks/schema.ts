import * as v from "valibot";
import { integer, picklist, required } from "#/shared/lib/schema";
import { FILM_TYPES, PACKAGINGS, PROCESSES } from "./types";

export const StockSchema = v.object({
  brand: required("Brand is required."),
  name: required("Name is required."),
  type: picklist(FILM_TYPES),
  boxIso: integer(1, "Box ISO must be at least 1."),
  process: picklist(PROCESSES),
  packaging: picklist(PACKAGINGS),
  stockOrigin: v.string(),
  packOrigin: v.string(),
  baseStockId: v.string(),
  description: v.string(),
});
