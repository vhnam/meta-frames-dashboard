import { describe, expect, it } from "vite-plus/test";
import { scannerKinds } from "#/test/fakeServer";
import {
  completeSettings,
  describeSettings,
  optionsForKind,
  sameSettings,
  startingSettings,
} from "./format";
import type { ScannerKindOptions } from "./types";

// as the API client reads them: no kind becomes null
const kinds = scannerKinds.map((entry) => ({
  ...entry,
  kind: entry.kind ?? null,
})) as ScannerKindOptions[];

describe("scan settings", () => {
  it("finds the options of a kind, and of a scanner of unknown kind", () => {
    expect(optionsForKind(kinds, "flatbed").map((option) => option.key)).toEqual([
      "dpi",
      "dust_removal",
    ]);
    expect(optionsForKind(kinds, null).map((option) => option.key)).toEqual(["resolution"]);
    expect(optionsForKind(undefined, "flatbed")).toEqual([]);
  });

  it("fills defaults and drops keys of another kind", () => {
    const flatbed = optionsForKind(kinds, "flatbed");
    expect(completeSettings(flatbed, { dpi: 4800, resolution: "hi_res" })).toEqual({
      dpi: 4800,
      dust_removal: false,
    });
    expect(
      startingSettings(kinds, { kind: "flatbed", defaultSettings: { dust_removal: true } }),
    ).toEqual({ dpi: 3200, dust_removal: true });
  });

  it("words settings in one line", () => {
    const flatbed = optionsForKind(kinds, "flatbed");
    expect(describeSettings({ dust_removal: true, dpi: 4800 }, flatbed)).toBe(
      "Resolution (dpi): 4800 · Dust removal (ICE)",
    );
    expect(describeSettings({ resolution: "hi_res" }, optionsForKind(kinds, "minilab"))).toBe(
      "Hi-res",
    );
    expect(describeSettings({ stitch_shots: 4 }, flatbed)).toBe("stitch_shots: 4");
    expect(describeSettings({ dust_removal: false }, flatbed)).toBe("Default settings");
  });

  it("compares settings whatever the key order", () => {
    expect(sameSettings({ dpi: 1, dust_removal: true }, { dust_removal: true, dpi: 1 })).toBe(true);
    expect(sameSettings({ dpi: 1 }, { dpi: 2 })).toBe(false);
  });
});
