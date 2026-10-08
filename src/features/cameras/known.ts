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
  for (const v of values.map((x) => x?.trim()).filter(Boolean) as string[]) {
    const known = byKey.get(v.toLowerCase());
    if (known) known.count! += 1;
    else byKey.set(v.toLowerCase(), { value: v, count: 1 });
  }
  return [...byKey.values()].sort((a, b) => a.value.localeCompare(b.value));
};

/** Values already used on any camera or lens, inactive ones included, for pick-or-add fields. */
function useKnown(pick: (gear: Camera | Lens) => string | undefined) {
  const cameras = useCameraList(true);
  const lenses = useLensList();
  return computed(() =>
    countUnique([
      ...(cameras.data.value ?? []).map((r) => pick(r.camera)),
      ...(lenses.data.value ?? []).map((r) => pick(r.lens)),
    ]),
  );
}

export const useKnownMounts = () => useKnown((g) => g.mount);
export const useKnownBrands = () => useKnown((g) => g.brand);
