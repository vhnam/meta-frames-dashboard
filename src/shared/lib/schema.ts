import * as v from "valibot";

export const required = (message: string) =>
  v.pipe(v.string(message), v.trim(), v.nonEmpty(message));

export const integer = (min: number, message: string) =>
  v.pipe(v.number(message), v.integer("Must be a whole number."), v.minValue(min, message));

export const picklist = <const TOptions extends readonly string[]>(options: TOptions) =>
  v.picklist(options, "Select an option.");
