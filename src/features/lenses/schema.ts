import * as v from "valibot";
import { integer } from "#/shared/lib/schema";

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
      (input) => input.builtIn || input.brand.trim() !== "",
      "Brand is required.",
    ),
    ["brand"],
  ),
  v.forward(
    v.partialCheck(
      [["builtIn"], ["model"]],
      (input) => input.builtIn || input.model.trim() !== "",
      "Model is required.",
    ),
    ["model"],
  ),
  v.forward(
    v.partialCheck(
      [["builtIn"], ["mount"]],
      (input) => input.builtIn || input.mount.trim() !== "",
      "Mount is required.",
    ),
    ["mount"],
  ),
);
