import * as v from "valibot";
import { required } from "#/shared/lib/schema";
import { SCANNER_KINDS } from "./types";

export const ScannerSchema = v.object({
  brand: required("Brand is required."),
  // a lab may run a Noritsu whose model nobody knows: only the brand is required
  model: v.string(),
  kind: v.optional(v.union([v.literal(""), v.picklist(SCANNER_KINDS)])),
  notes: v.string(),
});
