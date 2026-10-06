import * as v from "valibot";
import { required } from "#/shared/lib/schema";

export const LabSchema = v.object({
  name: required("Lab name is required."),
  address: v.string(),
});
