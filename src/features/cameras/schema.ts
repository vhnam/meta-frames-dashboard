import * as v from "valibot";
import { integer, required } from "#/shared/lib/schema";

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
