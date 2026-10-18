import { computed } from "vue";
import { useLensList } from "#/features/lenses/queries";
import type { Lens } from "#/features/lenses/types";
import type { ComboOption } from "#/shared/components/combobox";
import { useCameraList } from "./queries";
import type { Camera } from "./types";

/**
 * Sorted, trimmed, without blanks, merging values that differ only in case (first spelling
 * wins). Each keeps how many items use it, so a one-off typo stands out.
 */
export const countUnique = (values: (string | undefined)[]): ComboOption[] => {
  const byKey = new Map<string, ComboOption>();
  for (const value of values.map((entry) => entry?.trim()).filter(Boolean) as string[]) {
    const known = byKey.get(value.toLowerCase());
    if (known) known.count! += 1;
    else byKey.set(value.toLowerCase(), { value: value, count: 1 });
  }
  return [...byKey.values()].sort((left, right) => left.value.localeCompare(right.value));
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
export const useKnownBrands = () => useKnown((camera) => camera.brand);
