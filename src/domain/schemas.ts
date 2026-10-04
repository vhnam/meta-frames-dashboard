import * as v from "valibot";
import { FILM_TYPES, FORMATS, PACKAGINGS, PROCESSES } from "./types";

const required = (message: string) => v.pipe(v.string(message), v.trim(), v.nonEmpty(message));
const integer = (min: number, message: string) =>
  v.pipe(v.number(message), v.integer("Must be a whole number."), v.minValue(min, message));
const picklist = <const T extends readonly string[]>(options: T) =>
  v.picklist(options, "Select an option.");

export const CameraSchema = v.pipe(
  v.object({
    brand: required("Brand is required."),
    model: required("Model is required."),
    fixedLens: v.boolean(),
    mount: v.string(),
    description: v.string(),
    focalLength: v.optional(integer(1, "Focal length must be at least 1 mm.")),
    maxAperture: v.optional(v.pipe(v.number(), v.minValue(0.5, "Aperture must be at least 0.5."))),
  }),
  v.forward(
    v.partialCheck(
      [["fixedLens"], ["mount"]],
      (i) => i.fixedLens || i.mount.trim() !== "",
      "Mount is required for interchangeable-lens cameras.",
    ),
    ["mount"],
  ),
  v.forward(
    v.partialCheck(
      [["fixedLens"], ["focalLength"]],
      (i) => !i.fixedLens || i.focalLength != null,
      "Focal length is required for the built-in lens.",
    ),
    ["focalLength"],
  ),
  v.forward(
    v.partialCheck(
      [["fixedLens"], ["maxAperture"]],
      (i) => !i.fixedLens || i.maxAperture != null,
      "Max aperture is required for the built-in lens.",
    ),
    ["maxAperture"],
  ),
);

export const LensSchema = v.pipe(
  v.object({
    builtIn: v.boolean(),
    brand: v.string(),
    model: v.string(),
    mount: v.string(),
    focalLength: integer(1, "Focal length must be a positive whole number (mm)."),
    maxAperture: v.pipe(
      v.number("Max aperture is required."),
      v.minValue(0.5, "Aperture must be at least 0.5."),
    ),
    description: v.string(),
  }),
  v.forward(
    v.partialCheck(
      [["builtIn"], ["brand"]],
      (i) => i.builtIn || i.brand.trim() !== "",
      "Brand is required.",
    ),
    ["brand"],
  ),
  v.forward(
    v.partialCheck(
      [["builtIn"], ["model"]],
      (i) => i.builtIn || i.model.trim() !== "",
      "Model is required.",
    ),
    ["model"],
  ),
  v.forward(
    v.partialCheck(
      [["builtIn"], ["mount"]],
      (i) => i.builtIn || i.mount.trim() !== "",
      "Mount is required.",
    ),
    ["mount"],
  ),
);

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

export const LabSchema = v.object({
  name: required("Lab name is required."),
  address: v.string(),
});
