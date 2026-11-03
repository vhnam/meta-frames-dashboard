import { computed } from "vue";
import { useLensList } from "#/features/lenses/queries";
import type { Lens } from "#/features/lenses/types";
import type { ComboOption } from "#/shared/components/combobox";
import { useCameraList } from "./queries";
import type { Camera } from "./types";

/** Same look, same value: unifies Unicode forms and drops invisible characters and outer spaces. */
const cleaned = (value: string | undefined) =>
  value
    ?.normalize("NFKC")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .trim();

/**
 * Sorted, cleaned, without blanks, merging values that differ only in case (first spelling
 * wins). Each keeps how many items use it, so a one-off typo stands out.
 */
export const countUnique = (values: (string | undefined)[]): ComboOption[] => {
  const byKey = new Map<string, ComboOption>();
  for (const value of values.map(cleaned).filter(Boolean) as string[]) {
    const known = byKey.get(value.toLowerCase());
    if (known) known.count! += 1;
    else byKey.set(value.toLowerCase(), { value: value, count: 1 });
  }
  return [...byKey.values()].sort((left, right) => left.value.localeCompare(right.value));
};

/** The counted values with their counts, then the other known values with no count, sorted. */
export const countSome = (
  counted: (string | undefined)[],
  others: (string | undefined)[],
): ComboOption[] => {
  const options = countUnique(counted);
  const seen = new Set(options.map((option) => option.value.toLowerCase()));
  const extras = countUnique(others)
    .filter((option) => !seen.has(option.value.toLowerCase()))
    .map(({ value }) => ({ value }));
  return [...options, ...extras].sort((left, right) => left.value.localeCompare(right.value));
};

/** Values already used on any camera or lens, inactive ones included, for pick-or-add fields. */
function useKnown(pick: (gear: Camera | Lens) => string | undefined) {
  const cameras = useCameraList(true);
  const lenses = useLensList();
  return computed(() =>
    countUnique([
      ...(cameras.data.value ?? []).map((row) => pick(row.camera)),
      ...(lenses.data.value ?? []).map((row) => pick(row.lens)),
    ]),
  );
}

export const useKnownMounts = () => useKnown((camera) => camera.mount);

/** Every known brand; the count is how many items of the kind being added use it. */
export function useKnownBrands(kind: "camera" | "lens") {
  const cameras = useCameraList(true);
  const lenses = useLensList();
  return computed(() => {
    const cameraBrands = (cameras.data.value ?? []).map((row) => row.camera.brand);
    const lensBrands = (lenses.data.value ?? []).map((row) => row.lens.brand);
    return kind === "lens"
      ? countSome(lensBrands, cameraBrands)
      : countSome(cameraBrands, lensBrands);
  });
}
