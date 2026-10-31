import type { ScanOption, ScanSettings, Scanner, ScannerKind, ScannerKindOptions } from "./types";

/** Scan options of a kind; null is a scanner of unknown kind. Empty until the kinds have loaded. */
export const optionsForKind = (
  kinds: ScannerKindOptions[] | undefined,
  kind: ScannerKind | null | undefined,
): ScanOption[] => kinds?.find((entry) => entry.kind === (kind ?? null))?.options ?? [];

/** Every option's value: the given settings over each option's default. Keys of other kinds drop. */
export function completeSettings(options: ScanOption[], settings: ScanSettings = {}): ScanSettings {
  return Object.fromEntries(
    options.map((option) => [option.key, settings[option.key] ?? option.default]),
  );
}

/** Settings a new scan order on the scanner starts from. */
export const startingSettings = (
  kinds: ScannerKindOptions[] | undefined,
  scanner: Pick<Scanner, "kind" | "defaultSettings">,
) => completeSettings(optionsForKind(kinds, scanner.kind), scanner.defaultSettings);

/**
 * Settings as short phrases, such as ["Hi-res", "TIFF", "With film border"], in the order of the
 * options (the API stores settings in its own key order). A boolean turned off says nothing;
 * keys the options do not know show as key: value.
 */
export function settingsParts(settings: ScanSettings, options: ScanOption[]): string[] {
  const known = options.flatMap((option) => {
    if (!(option.key in settings)) return [];
    const value = settings[option.key];
    if (option.type === "boolean") return value === true ? [option.label] : [];
    if (option.type === "enum")
      return [option.values?.find((choice) => choice.value === value)?.label ?? String(value)];
    return [`${option.label}: ${String(value)}`];
  });
  const unknown = Object.entries(settings)
    .filter(([key]) => !options.some((option) => option.key === key))
    .map(([key, value]) => `${key}: ${String(value)}`);
  return [...known, ...unknown];
}

/** Settings in one line, such as "Hi-res · TIFF · With film border". */
export const describeSettings = (settings: ScanSettings, options: ScanOption[]) =>
  settingsParts(settings, options).join(" · ") || "Default settings";

const byKey = (settings: ScanSettings) =>
  JSON.stringify(Object.entries(settings).sort(([left], [right]) => left.localeCompare(right)));

export const sameSettings = (left: ScanSettings, right: ScanSettings) =>
  byKey(left) === byKey(right);
