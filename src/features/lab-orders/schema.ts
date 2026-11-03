import * as v from "valibot";
import { required } from "#/shared/lib/schema";

const amount = v.optional(
  v.pipe(v.number("Enter a number."), v.minValue(0, "The amount must be 0 or more.")),
);

export const LabOrderSchema = v.object({
  labId: required("Select a lab."),
  code: required("Order code is required."),
  orderedAt: required("Order date is required."),
  dueDate: v.optional(v.string()),
  vat: amount,
  discount: amount,
  notes: v.optional(v.string()),
});
